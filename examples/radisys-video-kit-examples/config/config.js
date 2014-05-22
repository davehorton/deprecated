
module.exports = {

	drachtio: {
		host: 'localhost'
		,port: 8022
		,secret: 'cymru'
	}

	,assemblePlayVideo: function( media, iterations ) {
		var msml = {
			play: {
				barge: false
				,cleardb: false
				,playexit: {
					send: {
						target:'source'
						,event:'app.playDone'
						,namelist: 'play.amt play.end'
					}
				}
			}
		} ; 
		msml.play.audio = {
			uri: media
			,iterations: iterations
		} ;
		return msml ;
	}


} ;
