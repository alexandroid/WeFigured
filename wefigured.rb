class WeFigured < Sinatra::Base

  get '/?' do
    erb :'index'
  end

  # This URL is hit from the mobile app, an auth code for the user is present in the query string
  get '/map' do
    erb :'map'
  end

  get '/test' do
      Geoloqi.post Geoloqi::OAUTH_TOKEN, "place/update/WB5", {:extra => {:occupied => 1, :user_id => 'w_michael_wasser'}}
      Geoloqi.post Geoloqi::OAUTH_TOKEN, "place/update/WB7", {:extra => {:occupied => 1, :user_id => 'w_sidneyallen'}}
      Geoloqi.post Geoloqi::OAUTH_TOKEN, "place/update/WB6", {:extra => {:occupied => 1, :user_id => 'w_alex_donn'}}
      Geoloqi.post Geoloqi::OAUTH_TOKEN, "place/update/WB8", {:extra => {:occupied => 1, :user_id => 'w_mattdyor'}}
      
      Geoloqi.post Geoloqi::OAUTH_TOKEN, "place/update/WB4", {:extra => {:occupied => 1, :user_id => 'w_attdeveloper'}}
      Geoloqi.post Geoloqi::OAUTH_TOKEN, "place/update/WAw", {:extra => {:occupied => 1, :user_id => 'w_haysom_runner'}}
      Geoloqi.post Geoloqi::OAUTH_TOKEN, "place/update/WAy", {:extra => {:occupied => 1, :user_id => 'w_nickdenny'}}
      Geoloqi.post Geoloqi::OAUTH_TOKEN, "place/update/WB0", {:extra => {:occupied => 1, :user_id => 'w_blsaws'}}
      Geoloqi.post Geoloqi::OAUTH_TOKEN, "place/update/WAz", {:extra => {:occupied => 1, :user_id => 'w_kirillzubovsky'}}
      Geoloqi.post Geoloqi::OAUTH_TOKEN, "place/update/WB3", {:extra => {:occupied => 1, :user_id => 'w_alexandr0id'}}
      # uncomment to save the world
      # Geoloqi.post Geoloqi::OAUTH_TOKEN, "place/update/WAs", {:extra => {:occupied => 1, :user_id => 'w_aaronpk'}}
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

  # Geoloqi calls this URL when someone who's subscribed to the layer reaches one of the places
  post '/trigger_enter' do
    body = SymbolTable.new JSON.parse(request.body)

    @player = Player.first :game => Game.first(:layer_id => body.layer.layer_id), :geoloqi_user_id => body.user.user_id
    
    if body.place.extra.occupied.to_i == 0
      Geoloqi.post Geoloqi::OAUTH_TOKEN, "place/update/#{body.place.place_id}", {:extra => {:occupied => 1, :user_id => body.user.user_id}}
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

    places = []
    response['places'].each do |place|
      places << {:place_id => place['place_id'],
                 :latitude => place['latitude'],
                 :longitude => place['longitude'],
                 :user_id => place['extra']['user_id'],
                 :occupied => place['extra']['occupied']}
    end

    {:places => places}.to_json
  end

  get '/player/:user_id/map_icon.png' do
    filename = File.join WeFigured.root, "public", "icons", params[:user_id] + '.png';
    if File.exist?(filename)
      send_file filename
    else
      # Fetch the user profile from Geoloqi

      case params[:user_id]
      when "w_michael_wasser"
        profile_image = 'https://si0.twimg.com/profile_images/1199279268/profilepic_reasonably_small.jpg'
      when "w_sidneyallen"
        profile_image = 'http://a0.twimg.com/profile_images/1140421907/sid-avatar_reasonably_small.jpg'
      when "w_alex_donn"
        profile_image = 'http://a1.twimg.com/profile_images/1183315528/alex_reasonably_small.jpg'
      when "w_mattdyor"
        profile_image = 'http://a2.twimg.com/profile_images/1175387129/RallyWire-Icon_reasonably_small.png'
      when "w_attdeveloper"
        profile_image = 'http://a2.twimg.com/profile_images/1111456366/Globe_Logo_normal_reasonably_small.jpg'
      when "w_haysom_runner"
        profile_image = 'http://a1.twimg.com/profile_images/97593631/abc_reasonably_small.JPG'
      when "w_nickdenny"
        profile_image = 'http://a2.twimg.com/profile_images/210812576/me_black_n_white_reasonably_small.jpg'
      when "w_blsaws"
        profile_image = 'http://a0.twimg.com/profile_images/771195062/20091111_014712_reasonably_small.jpg'
      when "w_kirillzubovsky"
        profile_image = 'http://a1.twimg.com/profile_images/1347431366/newbwimage_reasonably_small.jpg'
      when "w_alexandr0id"
        profile_image = 'http://a3.twimg.com/sticky/default_profile_images/default_profile_2_reasonably_small.png'
      when "w_vagababov"
        profile_image = 'http://a2.twimg.com/profile_images/217557213/1619522_reasonably_small.jpg'
      when "w_aaronpk"
        profile_image = 'http://a1.twimg.com/profile_images/553711946/aaronpk-bw_reasonably_small.jpg'
      else
        response = Geoloqi.get Geoloqi::OAUTH_TOKEN, 'account/profile?user_id=' + params[:user_id]
        profile_image = response.profile_image
      end
      
      if !profile_image.nil? && profile_image != ''
        playerImg = Magick::Image.read(profile_image).first
        playerImg.crop_resized!(16, 16, Magick::NorthGravity)
      else
        playerImg = Magick::Image.read(File.join(WeFigured.root, "public", "img", "mini-dino-blue.png")).first
      end
      markerIcon = Magick::Image.read(File.join(WeFigured.root, "public", "img", "player-icon-blue.png")).first
      result = markerIcon.composite(playerImg, 3, 3, Magick::OverCompositeOp)
      result.write(filename)
      send_file filename
    end
  end
  
end
