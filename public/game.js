
var cg = {
	s: function(w,h) {
		return new google.maps.Size(w,h);
	},
	p: function(w,h) {
		return new google.maps.Point(w,h);
	},
	playerImage: function(id) {
		return new google.maps.MarkerImage("/player/"+id+"/map_icon.png", new google.maps.Size(38, 31), new google.maps.Point(0,0), new google.maps.Point(11, 40));
	}
}

var coins = {
	red: new google.maps.MarkerImage("/img/cirred.png", cg.s(16,16),  cg.p(0, 0), cg.p(8, 8)),
	blue: new google.maps.MarkerImage("/img/cirblue.png", cg.s(16,16), cg.p(0, 0), cg.p(8, 8)),
};


$(function(){
  	var people = [];
  	var pellets = [];
  	var lastRequestTime = 0;
	
  	var myOptions = {
  		zoom: 15,
  		center: new google.maps.LatLng(47.62286, -122.34320),
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
  					var position = new google.maps.LatLng(pellet.latitude, pellet.longitude);
  					
  					if(pellet.occupied == "0" || pellet.occupied == null) {
  						markerIcon = coins.blue;
  					} else {
  						markerIcon = coins.red;
  					}

					if(typeof pellets[pellet.place_id] == "undefined") {
						// This pellet is not yet on the screen. Create it.
	  					pellets[pellet.place_id] = {
	  						id: pellet.place_id,
	  						user: new google.maps.Marker({
	  							position: position,
	  							map: map,
	  							icon: cg.playerImage(pellet.user_id)
	  						}),
	  						marker: new google.maps.Marker({
	  							position: position,
	  							map: map,
	  							icon: markerIcon
	  						})
	  					};
	  				} else {
	  					// Pellet is already on the screen, decide whether we should update it
	  					var p = pellets[pellet.place_id];
	  					if(pellet.occupied != p.occupied) {
	  						p.marker.setMap(null);
	  						p.marker = new google.maps.Marker({
	  							position: new google.maps.LatLng(pellet.latitude, pellet.longitude),
	  							map: map,
	  							icon: markerIcon
	  						});
	  						// Remove the previous player marker
	  						if(p.user) {
	  							p.user.setMap(null);
	  						}
	  						p.user = null;
	  						if(pellet.occupied == "1") {
	  							p.user = new google.maps.Marker({
	  								position: position,
	  								map: map,
	  								icon: cg.playerImage(pellet.user_id)
	  							});
	  						}
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
});

function drawLines(map) {
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
      strokeColor: "#2380ff",
      strokeOpacity: 0.8,
      strokeWeight: 5
    });
    var flightPath2 = new google.maps.Polyline({
      path: flightPlanCoordinates2,
      strokeColor: "#2380ff",
      strokeOpacity: 0.8,
      strokeWeight: 5
    });

 
   flightPath1.setMap(map);
   flightPath2.setMap(map);
  }
