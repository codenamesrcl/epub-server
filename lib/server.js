var http = require('http'),
    urlUtil = require('url'),
    lib7z = require('7z-wrapper'),
    mimetypes = require('mime-types'),
    objFactory = require('./objFactory');

var server = null,
    manifest = null,
    epubsource = null,
    requestTicker = 0;

/**
 * Creates and starts a http server to act as the epub server
 * @param  {int} port     A value for the server port
 * @param  {object} epubmanifest An object of type {@link epubServer.EpubManifest}
 * @return {object}              Returns an object of type {@link epubServer.ServerInfo}
 */
function startServer(port, epubpath, epubmanifest){
    var promise = new Promise(function(resolve,reject){
        if(server == null){
            server = http.createServer(requestHandler)
            server.listen(port, function(){
                console.log("now listening on " + port);
                resolve(objFactory.ServerInfo(port, epubmanifest));
            });
        }
        else{
            resolve(objFactory.ServerInfo(port, epubmanifest));
        }

        //bind the new manifest and epubsource values
        manifest = epubmanifest;
        epubsource = epubpath;
    });

    return promise;

}

function stopServer(){
    if(server != null){
        server.stop();
    }
}

function requestHandler(request, response){
    if(request.method === 'GET'){
        var urlSpec = urlUtil.parse(request.url, true);

        //determine if the request should be handled by the API handler or the
        //generic handler
        if(urlSpec.pathname.startsWith('/api/')){
            API(urlSpec, response);
        }
        else{
            routeRequest(urlSpec, response);
        }
    }
    else{
        response.write('Invalid verb, this server only accepts GET requests');
        response.end();
    }
}

function routeRequest(urlSpec, response){
    var route = urlSpec.pathname.substr(1);

    if(urlSpec.query.page){
        //load a page, resolving the route of the page first
        var pagemanifest = manifest.manifest.find(function(item){
            return item.id == urlSpec.query.page;
        });

        if(pagemanifest){
            assetResponse(pagemanifest.href, response);
        }
        else{
            response.statusCode(500);
            response.end("Specific page not found in the manifest");
        }
    }
    else{
        assetResponse(route, response);
    }

}

function assetResponse(route, response){
    if(_isInManifest(route)){
        requestTicker++;

        var contentUrl = '';
        if(manifest.contentBasePath === '.'){
            contentUrl = route;
        }
        else{
            contentUrl = manifest.contentBasePath + '/' + route;
        }
        // console.log(manifest.contentBasePath);
        // console.log(contentUrl);
        lib7z.extract.file.toMemory({
            archpath: epubsource,
            filepath: contentUrl,
            reqname: 'asset' + requestTicker,
            //verbose:true
        })
        .then(
            function(assetResult){
                try{
                    //console.log(mimetypes.lookup(route));
                    response.statusCode = 200;
                    //response.setHeader('Content-Length', assetResult.files[0].buffer.length);
                    response.setHeader('Content-Type', mimetypes.lookup(route));

                    //console.log("writing buffer");
                    response.end(assetResult.data);
                }
                catch(err){
                    console.log(err);
                    response.statusCode = 500;
                    response.end("Error serving the asset");
                }
            },
            function(error){
                console.error(error);
                response.statusCode = 500;
                response.end("Error extracting from epub");
            }
        );
    }
    else{
        response.statusCode = 500;
        response.end('asset not found');
    }
}

function API(urlSpec, response){
    var apiroute = urlSpec.pathname.substr(5);

    switch(apiroute){
        case "tableofcontents":
            response.statusCode = 200;
            response.setHeader('Content-Type', 'application/json');
            response.end(JSON.stringify(manifest.spine));
            break;
        case "meta":
            response.statusCode = 200;
            response.setHeader('Content-Type', 'application/json');
            response.end(JSON.stringify(manifest.metadata, null, 3));
            break;
        case "manifest":
            response.statusCode = 200;
            response.setHeader('Content-Type', 'application/json');
            response.end(JSON.stringify(manifest, null, 3));
            break;
        default:
            // response.write();
            response.end("Invalid API request");
            break;
    }
}

function _isInManifest(path){
    var isAvailable = manifest.manifest.find(function(item){
        return item.href === path;
    })

    if(isAvailable){
        return true;
    }
    return false;
}


module.exports = {
    startServer: startServer,
    stopServer: stopServer
}
