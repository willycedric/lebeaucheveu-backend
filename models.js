'use strict';

exports = module.exports = function(app, mongoose) {
  //embeddable docs first
  require('./schema/Note')(app, mongoose);
  require('./schema/Status')(app, mongoose);
  require('./schema/StatusLog')(app, mongoose);
  require('./schema/Category')(app, mongoose);
  require('./schema/BlogCategory')(app,mongoose);
   require('./schema/haircutCatalog')(app,mongoose); 
   require('./schema/ActivityArea')(app,mongoose);

  //then regular docs
  require('./schema/User')(app, mongoose);
  require('./schema/Admin')(app, mongoose);
  require('./schema/AdminGroup')(app, mongoose);
  require('./schema/Account')(app, mongoose);
  require('./schema/Hairdresser')(app, mongoose);
  require('./schema/LoginAttempt')(app, mongoose);
  require('./schema/Blog')(app,mongoose);
  require('./schema/Catalog')(app,mongoose);
  require('./schema/HomeGalleryEntries')(app, mongoose);
};
