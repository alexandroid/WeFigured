
var cg = {
	s: function(w,h) {
		return new google.maps.Size(w,h);
	},
	p: function(w,h) {
		return new google.maps.Point(w,h);
	},
	playerImage: function(id, team, useDefault) {
		return new google.maps.MarkerImage("/player/"+id+"/"+team+"/map_icon.png", new google.maps.Size(38, 31), new google.maps.Point(0,0), new google.maps.Point(10, 30));
	}
}

var coinSpriteURL = "/img/gameboard-sprite.png";
var coinHeight = 25;
var coins = {
	10: {
		red: new google.maps.MarkerImage(coinSpriteURL, cg.s(17,17),  cg.p(0, 277), cg.p(17/2, 17/2)),
		blue: new google.maps.MarkerImage(coinSpriteURL, cg.s(17,17), cg.p(0, 302), cg.p(17/2, 17/2)),
		grey: new google.maps.MarkerImage(coinSpriteURL, cg.s(17,17), cg.p(0, 327), cg.p(17/2, 17/2))
	},
	20: {
		red: new google.maps.MarkerImage(coinSpriteURL, cg.s(19,19),  cg.p(17, 276), cg.p(19/2, 19/2)),
		blue: new google.maps.MarkerImage(coinSpriteURL, cg.s(19,19), cg.p(17, 300), cg.p(19/2, 19/2)),
		grey: new google.maps.MarkerImage(coinSpriteURL, cg.s(19,19), cg.p(17, 326), cg.p(19/2, 19/2))
	},
	30: {
		red: new google.maps.MarkerImage(coinSpriteURL, cg.s(21,21),  cg.p(36, 275), cg.p(21/2, 21/2)),
		blue: new google.maps.MarkerImage(coinSpriteURL, cg.s(21,21), cg.p(36, 299), cg.p(21/2, 21/2)),
		grey: new google.maps.MarkerImage(coinSpriteURL, cg.s(21,21), cg.p(36, 325), cg.p(21/2, 21/2))
	},
	50: {
		red: new google.maps.MarkerImage(coinSpriteURL, cg.s(25,25),  cg.p(57, 273), cg.p(25/2, 25/2)),
		blue: new google.maps.MarkerImage(coinSpriteURL, cg.s(25,25), cg.p(57, 297), cg.p(25/2, 25/2)),
		grey: new google.maps.MarkerImage(coinSpriteURL, cg.s(25,25), cg.p(57, 323), cg.p(25/2, 25/2))
	}
};


var playerIconSize = new google.maps.Size(32, 32);
var playerIconOrigin = new google.maps.Point(0,0);
var playerIconAnchor = new google.maps.Point(16, 32);
var playerIcons = {
	blue: new google.maps.MarkerImage("http://www.google.com/intl/en_us/mapfiles/ms/icons/blue-dot.png", playerIconSize, playerIconOrigin, playerIconAnchor),
	red: new google.maps.MarkerImage("http://www.google.com/intl/en_us/mapfiles/ms/icons/red-dot.png", playerIconSize, playerIconOrigin, playerIconAnchor)
}

// player icon: '/player/' + player.geoloqi_id + "/" + player.team + '/map_icon.png'

  $(function(){
  	var people = [];
  	var pellets = [];
  	var lastRequestTime = 0;
	
  	var myOptions = {
  		zoom: 15,
  		center: new google.maps.LatLng(47.61486, -122.34320),
  		mapTypeId: google.maps.MapTypeId.ROADMAP,
  		mapTypeControl: true
  	};

  	// Create the main map
  	if(!document.getElementById("map")) {
  		return;
	}

  	map = new google.maps.Map(document.getElementById("map"), myOptions);
   drawLines(map);

    // Load the initial game state and place the pins on the map. Sample data in pellets.json

  	updateGame();
  	function updateGame() {
  		$.ajax({ 
  			url: "/game/"+$("#layer_id").val()+"/status.json",
  			type: "GET",
  			data: {after: lastRequestTime},
  			dataType: "json", 
  			success: function(data) {
  				// Add the new pellets
  				$(data.places).each(function(i, pellet) {
  					if(pellet.occupied == "0" || pellet.occupied == null) {
  						markerIcon = coins[10].grey;
  					} else {
  						markerIcon = coins[10].red;
  					}

					if(typeof pellets[pellet.place_id] == "undefined") {
	  					pellets[pellet.place_id] = {
	  						id: pellet.place_id,
	  						team: pellet.team,
	  						marker: new google.maps.Marker({
	  							position: new google.maps.LatLng(pellet.latitude, pellet.longitude),
	  							map: map,
	  							icon: markerIcon
	  						})
	  					};
	  				} else {
	  					// Pellet is already on the screen, decide whether we should update it
	  					var p = pellets[pellet.place_id];
	  					if(pellet.team != p.team) {
	  						p.marker.setMap(null);
	  						p.marker = new google.maps.Marker({
	  							position: new google.maps.LatLng(pellet.latitude, pellet.longitude),
	  							map: map,
	  							icon: markerIcon
	  						});
	  						p.team = pellet.team;
	  					}
	  				}
  				});
  				
				lastRequestTime = Math.round((new Date()).getTime() / 1000);
			  	setTimeout(updateGame, 5000);
  		    }
  		});
  	}

    function deletePellet(id) {
  	  $(pellets).each(function(i, pellet) {
  		  if(pellet.id == id) {
  		    // console.log("Pellet id removal");
        	pellet.marker.setMap(null);
        }
      });
    }

    function receivePlayerData(data) {
  		var id = data.id;
  		var username = data.username;
  		var latitude = data.latitude;
  		var longitude = data.longitude;
  		var myLatLng = new google.maps.LatLng(latitude, longitude);
  		var exists;
  		for(i=0;i<people.length;i++){
  			var person = people[i];
  			if(person.id != id){
			
  			}else{
  				exists = 1;
  				person.marker.setPosition(myLatLng);
  			}
  		}
  		if(!exists){
  			var marker = new google.maps.Marker({
  				position: myLatLng,
  				map: map,
  				title: username,
  				icon: cg.playerImage(id, data.team, data.useDefaultIcon)
  			});
  			data.marker = marker;
  			people.push(data);
  		}
    }
  });

function drawLines(map) {
    var myLatLng = new google.maps.LatLng(47.619442,-122.346539);
    var myOptions = {
      zoom: 14,
      center: myLatLng,
      mapTypeId: google.maps.MapTypeId.TERRAIN
    };
 
    //var map = new google.maps.Map(document.getElementById("map_canvas"), myOptions);
 
    var flightPlanCoordinates1 = [
        //new google.maps.LatLng(47.614966, -122.343321), // our location?
        new google.maps.LatLng(47.614979,-122.343330),
        new google.maps.LatLng(47.616810,-122.340363),
        new google.maps.LatLng(47.618286,-122.340019),
        new google.maps.LatLng(47.619167,-122.341064),
        new google.maps.LatLng(47.619747,-122.342377),
        new google.maps.LatLng(47.619717,-122.343811),
        new google.maps.LatLng(47.619411,-122.344566),
        new google.maps.LatLng(47.618572,-122.345573),
        new google.maps.LatLng(47.617332,-122.347137),
        new google.maps.LatLng(47.619007,-122.349846),
        new google.maps.LatLng(47.620110,-122.351257),
        new google.maps.LatLng(47.622826,-122.347610),
    ];
    var flightPlanCoordinates2 = [
        new google.maps.LatLng(47.622032,-122.341087),
        new google.maps.LatLng(47.623348,-122.342850),
        new google.maps.LatLng(47.624561,-122.343559),
        new google.maps.LatLng(47.624561,-122.343559),
        new google.maps.LatLng(47.626282,-122.343407),
        new google.maps.LatLng(47.626514,-122.341064),
        new google.maps.LatLng(47.625530,-122.338409),
        new google.maps.LatLng(47.624866,-122.337143),
        new google.maps.LatLng(47.623898,-122.335899),
        new google.maps.LatLng(47.622566,-122.334930),
        new google.maps.LatLng(47.621147,-122.335854),
        new google.maps.LatLng(47.621147,-122.335854),
        new google.maps.LatLng(47.620903,-122.338623),
        new google.maps.LatLng(47.622074,-122.341110)
    ];
    var flightPath1 = new google.maps.Polyline({
      path: flightPlanCoordinates1,
      strokeColor: "#FF0000",
      strokeOpacity: 1.0,
      strokeWeight: 2
    });
    var flightPath2 = new google.maps.Polyline({
      path: flightPlanCoordinates2,
      strokeColor: "#FF0000",
      strokeOpacity: 1.0,
      strokeWeight: 2
    });

 
   flightPath1.setMap(map);
   flightPath2.setMap(map);
  }
