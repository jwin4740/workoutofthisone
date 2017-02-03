// AKhilas firebase

// var config = {
//     apiKey: "AIzaSyAXt8VC_K0qy0I1esj1Fvg96bZo856bakQ",
// authDomain: "roadtripapp-a18f6.firebaseapp.com",
// databaseURL: "https://roadtripapp-a18f6.firebaseio.com",
// storageBucket: "roadtripapp-a18f6.appspot.com",
// messagingSenderId: "125448158208"
// };

// James firebase
var config = {
    apiKey: "AIzaSyBTaP-0LgIFFa2gWd6hlKCr8cHEdoVK-2I",
    authDomain: "therace-ec187.firebaseapp.com",
    databaseURL: "https://therace-ec187.firebaseio.com",
    storageBucket: "therace-ec187.appspot.com",
    messagingSenderId: "490377130712"
};

firebase.initializeApp(config);

var database = firebase.database();


var startValue = "";
var endValue = "";
var directionsDisplay = "";
var directionsService = "";
var CLIENT_ID = "7626a5c491b046fea9af0307df562248";
var CLIENT_SECRET = "93c675af1036436aa010a7e396d8da06";
var artists = [];
var shuffledTrackArray = [];
var listOfTracks = [];
var trackURI = "";
var numberOfArtists = 0;
var totalNumberOfTimes = 0;
var numberOfTracksPerArtist = 0;
var songLengthSec = 0;
var songLengthMin = 0;
var songLengthHour = 0;
var firstLoginCount = 0;
var loginCount;
var trafficLayer;
var map = "";
var analytics = "";
var analyticsArray = [];
var artCountArray = [];

// array to store uri to fetch each song from spotify
var myTrackDataArray = [];
var j = 0;
var tripLength = 0; // in milliseconds this is a 1 hour trip
var songLengthTotal = 0;
// To store artist destination and timestamp for data analytics
var analyticsData = {};

// Getting accordion to be collapsed on initial display 
$("#collapse1").removeClass("in");

// ******** Google maps API code ********
// Google maps function to get map and calls directionDisplay
function initMap() {
    directionsService = new google.maps.DirectionsService;
    directionsDisplay = new google.maps.DirectionsRenderer;
    distance = new google.maps.DistanceMatrixService;
    trafficLayer = new google.maps.TrafficLayer();
    heatmapLayer = new google.maps.FusionTablesLayer({
          query: {
            select: 'location',
            from: '1xWyeuAhIFK_aED1ikkQEGmR8mINSCJO9Vq-BPQ'
          },
          heatmap: {
            enabled: true
          }
        })
    map = new google.maps.Map($('#map')[0], {
        zoom: 7,
        center: {
            lat: 41.85,
            lng: -87.65
        }
    });

       
        heatmapLayer.setMap(map);
      
    directionsDisplay.setMap(map);
    directionsDisplay.setPanel($('#right-panel')[0]);
    console.log($('#right-panel')[0]);
    // console.dir(map);

    startValue = $("#start").val();
    console.log(startValue);
    endValue = $("#end").val();
    console.log(endValue);

    calculateAndDisplayRoute(directionsService, directionsDisplay, distance);

} // End of google map display

$('#toggleTraffic').on("click", function() {
    trafficLayer.setMap(map);
});


// $('.mapOptions').on("click", function() {
//     if($(this).attr('id')=== "toggleTraffic"){

//         trafficLayer.setMap($('#toggleHeatmap').checked ? map : null);
//        // trafficLayer.setMap(map);

//     }else if($(this).attr('id')=== "toggleHeatmap") {

//     heatmapLayer.setMap($('#toggleHeatmap').checked ? map : null);    
    
//     }

//    // if($('#toggleHeatmap').checked){

//     // heatmapLayer.setMap($('#toggleHeatmap').checked ? map : null);

// });

function displayDirectionsMap() {
    directionsDisplay.setMap(map);
}
// Function to calculate route, display and make call to Google distanceMatrix to get duration of trip
function calculateAndDisplayRoute(directionsService, directionsDisplay, distance) {
    directionsService.route({
        origin: startValue,
        destination: endValue,
        travelMode: 'DRIVING',
    }, function(response, status) {
        // console.log(response);
        if (status === 'OK') {
            directionsDisplay.setDirections(response);

        } else {
            console.log("ERROR - " + status);
            // window.alert('Directions request failed due to ' + status);
        }
    });

    distance.getDistanceMatrix({
        origins: [startValue],
        destinations: [endValue],
        travelMode: 'DRIVING',
    }, function(response, status) {
        console.log(response);
        var length = (response.rows[0].elements[0].duration.value);

        tripLength = length * 1000;
        console.log(response.rows[0].elements[0].duration.text);
        // console.log(msLength);

    });
    // Get current weather there
    getCurrentWeather();
} // End of function to calculate directions and distance

// Main Submit button get route info & modal button
$(".submit").on("click", function(e) {
    if (($("#start").val().trim() === "") || ($("#end").val().trim() === "")) {
        return;
    }
    $('#myModal').modal('show');
    e.preventDefault();
    $("#right-panel").empty();
    $("#collapse1").addClass("in");
    initMap();
    $("#locationInputForm").hide();
    $("h3").hide();

});

$('#myModal').on('shown.bs.modal', function() {
    $('#myInput').focus()
});



// ********* Code for Spotify song playing ********

// On Button Click for Artist Selection
$('#selectArtist').on('click', function() {
    if ($("#artist-input").val().trim() === "") {
        return;
    }
    // Grab the Artist Name
    var artist = $('#artist-input').val().trim();
    // Run the Artist Player Function (Passing in the Artist as an Argument)
    getArtistTrack(artist);
    // Letting user know
    $("#artist-input").val("You have been SoNgIfIeD!! Enjoy!");
    // Function to push data for data analytics
    // Prevents moving to the next page
    return false;
});

//constructor trackdata object
function trackdata(uri, songtitle, artist, songlength) {
    this.uri = uri,
        this.songtitle = songtitle,
        this.artist = artist,
        this.songlength = songlength
}

// artist and count analytics
function artcountconstruct(artist, artCount) {
  
        this.artist = artist,
        this.artCount = artCount
}

// Function to get a list of tracks of favorite artist and related artists 
function getArtistTrack(artist) {
    var artistID;
    queryURL = "https://api.spotify.com/v1/search?q=" + artist + "&type=artist";
    // ajax that gets artist ID
    $.ajax({
        url: queryURL,
        method: 'GET',
        // crossDomain: true
    }).done(function(response) {
        artistID = response.artists.items[0].id;

        // ajax to get related artists using artist ID received above
        $.ajax({
            url: "https://api.spotify.com/v1/artists/" + artistID + "/related-artists",
            method: 'GET'
        }).done(function(response) {
            // Loop through related artists' array and gets 10 tracks per artist
            numberOfArtists = response.artists.length;
            artists.push(artistID);
            // Looping through response received to push each related artist ID into artists array
            for (var i = 0; i < numberOfArtists; i++) {
                artists.push(response.artists[i].id);
            }
            totalNumberOfTimes = numberOfArtists * 10; // required to check if ajax calls are done
            console.log(totalNumberOfTimes);
            // LOOP THROUGH EACH ARTIST IN 'artists[]' TO GET 'tracks[]' VIA AJAX CALL 
            for (var i = 0; i < artists.length; i++) {
                $.ajax({
                    url: "https://api.spotify.com/v1/artists/" + artists[i] + "/top-tracks?country=SE",
                    method: "GET"
                }).done(function(response) {

                    /// WHEN DONE, LOOP THROUGH 'track[]' ARRAY TO GET EACH 'track' AND PUSH TO 'listOfTracks[]'
                    for (var i = 0; i < response.tracks.length; i++) {
                        listOfTracks.push(response.tracks[i]);
                        checkIfDone();
                    }

                });
            }
        });
    });
} // End of function that gets tracks to play

// Function that checks if ajax calls are complete
function checkIfDone() {
    --totalNumberOfTimes;

    if (totalNumberOfTimes == 0) {
        // console.log(listOfTracks);
        // console.log(listOfTracks[0].uri);
        for (var i = 0; i < listOfTracks.length; i++) {
            var trackDatavar = new trackdata(listOfTracks[i].uri, listOfTracks[i].name, listOfTracks[i].artists[0].name, Math.floor(listOfTracks[i].duration_ms / 1000));
            // Array of trackData objects
            myTrackDataArray.push(trackDatavar);
            // Pushing tracklist to firebase
            // database.ref("/tracklist").push(trackDatavar);
        }
        // console.log(myTrackDataArray);
        // Shuffling playlist
        playlistShuffle();
        // Create tracklist and spotify iFrames for each
        beginSpotifyPlaying();
    }
} // End of function to check if listOfTracks has been populated

// shuffles the playlist
function playlistShuffle() {
    var j, k;
    var temp;
    for (j = 0; j < myTrackDataArray.length; j++) {
        k = Math.floor(Math.random() * myTrackDataArray.length);
        temp = myTrackDataArray[j];
        myTrackDataArray[j] = myTrackDataArray[k];
        myTrackDataArray[k] = temp;
    }
} // End of shuffling function

// Function to display iFrames for each track in tracklist, and display tracklist
function beginSpotifyPlaying() {
    // do...while loop inserts iframes into DOM until the tracklist equals the trip duration

    database.ref("/analyze").push(myTrackDataArray);
    do {
        // implement a conversion from seconds to minutes
        var numMinutes = 0;
        durationOfFirstTrack = parseInt(listOfTracks[j].duration_ms);
        songLengthTotal = songLengthTotal + durationOfFirstTrack;
        var numSeconds = myTrackDataArray[j].songlength;

        // convert to minutes if seconds > 59
        do {
            numSeconds = numSeconds - 60;
            numMinutes++;
        } while (numSeconds > 59);

        console.log(numMinutes);
        console.log(numSeconds);

        // Converting single digit seconds to double digits for better display
        if (numSeconds === 1) {
            numSeconds = "01";
        }
        if (numSeconds === 2) {
            numSeconds = "02";
        }
        if (numSeconds === 3) {
            numSeconds = "03";
        }
        if (numSeconds === 4) {
            numSeconds = "04";
        }
        if (numSeconds === 5) {
            numSeconds = "05";
        }
        if (numSeconds === 6) {
            numSeconds = "06";
        }
        if (numSeconds === 7) {
            numSeconds = "07";
        }
        if (numSeconds === 8) {
            numSeconds = "08";
        }
        if (numSeconds === 9) {
            numSeconds = "09";
        }
        if (numSeconds === 0) {
            numSeconds = "00";
        }
        // Appending each track number, name, and duration to tracklist div
        $("#tracklist").append("<p class='displaytrack' data-value='" + j + "'><i class='fa fa-play-circle-o' aria-hidden='true'></i>" + (j + 1) + ". " + myTrackDataArray[j].artist + ": <span>" + myTrackDataArray[j].songtitle + " (" + numMinutes + ":" + numSeconds + ")</span></p><hr>");
        // Incrementing iterator
        j++;

    } while (songLengthTotal < tripLength);

    // Trip length
    songLengthTotal = Math.floor((songLengthTotal / 1000)); // songlength in seconds
    songLengthSec = songLengthTotal;
    if (songLengthSec > 3599) {
        do {

            songLengthSec = songLengthSec - 3600;
            songLengthHour++;
        }
        while (songLengthSec > 3599);
    }
    do {

        songLengthSec = songLengthSec - 60;
        songLengthMin++;
    }
    while (songLengthSec > 59);

    console.log(songLengthTotal);
    $("#playlistlength").append("( " + songLengthHour + "hrs " + songLengthMin + "mins " + songLengthSec + "secs)");
    // Playing each track on click of displayed track in tracklist
    $("#tracklist").on("click", ".displaytrack", function() {
        trackdatavalue = $(this).attr("data-value");
        firstSRC = myTrackDataArray[trackdatavalue].uri;
        var currentFrame = $("<iframe>");
        currentFrame.attr({
            width: "500px",
            height: "100px",
            src: "https://embed.spotify.com/?uri=" + firstSRC
        });
        // Display the iFrame
        $("#nowplaying").html(currentFrame);
    });
}

// To collect weather data
function getCurrentWeather() {
    var queryURL = "http://api.openweathermap.org/data/2.5/weather?q=" + endValue + "&APPID=51d5a2e80db66d661e97694890b4fb97";

    $.ajax({
        url: queryURL,
        method: 'GET'
    }).done(function(response) {
        console.log(queryURL);
        console.log(response);

        $("#destination").html(endValue.toUpperCase());
        $("#temperatureMax").html(Math.round((response.main.temp_max - 273.15) * 1.80 + 32) + " F");
        $("#temperatureMin").html(Math.round((response.main.temp_min - 273.15) * 1.80 + 32) + " F");
        $("#humidity").html(response.main.humidity);
        $("#typeOfWeather").html("<img src='http://openweathermap.org/img/w/" + response.weather[0].icon + ".png'> " + response.weather[0].description);

    });

}


// pushes a count to firebase each time someone logs into out app

database.ref("/logins").once("value", function(snapshot) {
    loginCount = parseInt(snapshot.val().views);
    console.log(loginCount);
    updateLoginCount(loginCount);

});

function updateLoginCount(loginCount) {
    loginCount++;
    console.log(loginCount);
    database.ref("/logins").set({
        views: loginCount
    });
    $("#logins").html(loginCount);
    

}
// var artCount = 0;
// database.ref("/analyze").on("child_added", function(childsnapshot) {

//     for (var i = 0; i < 200; i++) {
//         analyticsArray.push(childsnapshot.val()[i].artist);
//         console.log(analytics);
//     }
//     analyticsArray.sort();
//     console.log(analyticsArray);

//     for (var i = 0; i < 200; i++) {

//        var artCon = new artcountconstruct(analyticsArray[i], artCount)

//         for (var j = 0; j < analyticsArray.length; j++) {
//             if (analyticsArray[i] === analyticsArray[j]) {
//                 artCon.artCount++;
//             }

//         }
//         artCountArray.push(artCon);
//         database.ref("/analyze/topartists").push({
//             artist : analyticsArray[i],
//             count : artCon.artCount


//         })
        
//     }

//     console.log(artCountArray);
   
// });
