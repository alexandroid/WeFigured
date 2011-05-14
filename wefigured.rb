class WeFigured < Sinatra::Base

  get '/?' do
    erb :'index_stub'
  end

  get '/game/:layer_id/join' do
    @oauth_token = Geoloqi.get_token(params[:code], Geoloqi::BASE_URI+'game/'+params[:layer_id]+'/join')['access_token']
    @game = Game.create_unless_exists params[:layer_id]
   	user_profile = Geoloqi.get @oauth_token, 'account/profile'
    @player = Player.first :geoloqi_user_id => user_profile.user_id, :game => @game
    
    layer_info = Geoloqi.get @oauth_token, 'layer/info/'+params[:layer_id]
    if layer_info.subscription.nil? || layer_info.subscription == false || @player.nil?
      # The player has never subscribed to the layer before, so create a new record in our DB and set up their shared tokens.
      # Generate shared token so we can retrieve their location for the map later
    	shared_token = Geoloqi.post @oauth_token, 'link/create', {:description => "Created for "+@game.name, :minutes => 240}

      # Subscribe the player to the layer
    	Geoloqi.get @oauth_token, 'layer/subscribe/' + params[:layer_id]

	    if @player.nil?
	      @player = Player.new :name => user_profile.username, 
	                           :geoloqi_user_id => user_profile.user_id, 
	                           :token => shared_token.token, 
	                           :game => @game, 
	                           :team => @game.pick_team
        # If user_profile.profile_image is not there or is null, don't do this (Should prevent errors on non-twitter accounts)
        @player.profile_image = user_profile.profile_image unless user_profile.profile_image.nil? || user_profile.profile_image.empty?
        @player.save
		  end
      @player.send_message("You're on the " + @player.team.name + " team!").to_json
    end
    redirect "/game/" + params[:layer_id]
  end

  # This URL is hit from the mobile app, an auth code for the user is present in the query string
  get '/game' do
    erb :'index'
  end

  # Geoloqi calls this URL when someone who's subscribed to the layer reaches one of the places
  post '/trigger_enter' do
    body = SymbolTable.new JSON.parse(request.body)

    @player = Player.first :game => Game.first(:layer_id => body.layer.layer_id), :geoloqi_user_id => body.user.user_id

    if body.place.extra.occupied.to_i == 1
      Geoloqi.post Geoloqi::OAUTH_TOKEN, "place/update/#{body.place.place_id}", {:extra => {:occupied => 1, :user => body.user.name}}
      Geoloqi.post Geoloqi::OAUTH_TOKEN, "message/send", {:user_id => body.user.user_id, :text => "You made it! Now wait there a while or something..."}
    end
    
    # TODO: Check if all the points are occupied, and if so, send a message to everyone saying they win!
    
    
  end

  # Geoloqi calls this URL when someone who's subscribed to the layer leaves one of the places
  post '/trigger_exit' do
    body = SymbolTable.new JSON.parse(request.body)

    @player = Player.first :game => Game.first(:layer_id => body.layer.layer_id), :geoloqi_user_id => body.user.user_id

    if body.place.extra.occupied.to_i == 1
      Geoloqi.post Geoloqi::OAUTH_TOKEN, "place/update/#{body.place.place_id}", {:extra => {:occupied => 0, :user => ""}}
    end
  end

  get '/game/:layer_id/status.json' do
    # content_type 'application/json'

    response = Geoloqi.post Geoloqi::OAUTH_TOKEN, 'place/list', {:layer_id => params[:layer_id], :after => params[:after]}

    @game = Game.first :layer_id => params[:layer_id]

    places = []
    response['places'].each do |place|
      places << {:place_id => place['place_id'],
                 :latitude => place['latitude'],
                 :longitude => place['longitude'],
                 :points => place['extra']['points'],
                 :team => place['extra']['team'],
                 :active => place['extra']['active']}
    end

    @tokens = []
    @game.player.each do |player|
      @tokens.push player.token
    end
    response = Geoloqi.get Geoloqi::OAUTH_TOKEN, 'share/last?geoloqi_token=,' + @tokens.join(",")

    players = []
    @game.player(:order => :points_cache.desc).each do |player|
    	location = {}
    	response.each do |p|
    	  if p['username'] == player.name
    	    location = p
    	  end
    	end

    	players << {:geoloqi_id => player.geoloqi_user_id,
                  :score => player.points_cache,
	                :name => player.name,
	                :team => player.team.name,
	                :profile_image => player.profile_image,
	                :location => location}
    end
    {:places => places, :players => players}.to_json
  end
end
