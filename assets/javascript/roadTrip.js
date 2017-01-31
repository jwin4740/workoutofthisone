var config = {
apiKey: "AIzaSyA-d6axn-Er0ahgB4ZyebypjmVT7eXkcyU",
authDomain: "roadtrip-app-529d8.firebaseapp.com",
databaseURL: "https://roadtrip-app-529d8.firebaseio.com",
storageBucket: "roadtrip-app-529d8.appspot.com",
messagingSenderId: "74695053024"
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
// array to store uri to fetch each song from spotify
var myTrackDataArray = [];
var j = 0;
var tripLength = 0; // in milliseconds this is a 1 hour trip
var songLengthTotal = 0;

// ******** Google maps API code ********
// Google maps function to get map and calls directionDisplay
function initMap() {
    directionsService = new google.maps.DirectionsService;
    directionsDisplay = new google.maps.DirectionsRenderer;
    distance = new google.maps.DistanceMatrixService;
    var map = new google.maps.Map($('#map')[0], {
        zoom: 7,
        center: {
            lat: 41.85,
            lng: -87.65
        }
    });
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
            window.alert('Directions request failed due to ' + status);
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
       

    });


} // End of function to calculate directions and distance

// Main Submit button get route info
$(".btn").on("click", function(e) {
    e.preventDefault();
    $("#right-panel").empty();
    initMap();
});


// ********* Code for Spotify song playing ********

// On Button Click for Artist Selection
$('#selectArtist').on('click', function() {
    // Grab the Artist Name
    var artist = $('#artist-input').val().trim();
    // Run the Artist Player Function (Passing in the Artist as an Argument)
    getArtistTrack(artist);
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
                    console.log(response);
                    console.log(artists.length);
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
    console.log(totalNumberOfTimes);
    if (totalNumberOfTimes == 0) {
        // console.log(listOfTracks);
        // console.log(listOfTracks[0].uri);
        for (var i = 0; i < listOfTracks.length; i++) {
            var trackDatavar = new trackdata(listOfTracks[i].uri, listOfTracks[i].name, listOfTracks[i].artists[0].name, Math.floor(listOfTracks[i].duration_ms / 1000));
            // Array of trackData objects
            myTrackDataArray.push(trackDatavar);
            database.ref("/tracklist").push(trackDatavar);
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


// Have -> Tracklist

// Need to get -> songs playing on it's own from tracklist.
// child.remove() listtoLast(1), 


// Function to display iFrames for each track in tracklist, and display tracklist
function beginSpotifyPlaying() {
    // do...while loop inserts iframes into DOM until the tracklist equals the trip duration
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
        }while (numSeconds > 59);

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
        $("#tracklist").append("<p class='displaytrack' data-value='" + j + "'>" + (j + 1) + ") " + myTrackDataArray[j].artist + ": <span>" + myTrackDataArray[j].songtitle + " (" + numMinutes + ":" + numSeconds + ")</span></p>");
        // Incrementing iterator
        j++;

    }while (songLengthTotal < tripLength);

    // Trip length
    $("#playlistlength").append((songLengthTotal / 1000) + " seconds");
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