/*
 * predefined [EPSG:3821] projection
 * Please make sure your desired projection can find on http://epsg.io/
 *
 * Usage :
 *
 *
 * Created by Gipong <sheu781230@gmail.com>
 *
 */

var inputData = {},
geoData,
EPSGUser, url, encoding, EPSG,
EPSG4326 = proj4('EPSG:4326');

function loadjpg(config, returnData) {
    url = config.url;
    encoding = typeof config.encoding != 'utf-8' ? config.encoding : 'utf-8';
    EPSG = typeof config.EPSG != 'undefined' ? config.EPSG : 4326;

    loadEPSG('http://epsg.io/'+EPSG+'.js', function() {
        if(EPSG == 3821)
            proj4.defs([
                ['EPSG:3821', '+proj=tmerc +ellps=GRS67 +towgs84=-752,-358,-179,-.0000011698,.0000018398,.0000009822,.00002329 +lat_0=0 +lon_0=121 +x_0=250000 +y_0=0 +k=0.9999 +units=m +no_defs']
            ]);

        EPSGUser = proj4('EPSG:'+EPSG);

        if(typeof url != 'string') {
            var reader = new FileReader();
            reader.onload = function(e) {
                var URL = window.URL || window.webkitURL || window.mozURL || window.msURL,
                zip = new JSZip(e.target.result),
                jpeg =  zip.file(/.jpg$/i)[0],
                aux = zip.file(/.aux.xml$/i)[0],
                jgwx = zip.file(/.jgwx|jgw$/i)[0];

                var xmlContent = zip.file(aux.name).asText();
                var domParser = new DOMParser();
                var jpegXML = domParser.parseFromString(xmlContent, "text/xml");

                var paras = zip.file(jgwx.name).asText().split('\n');
                var paraSet = {
                    a: +paras[0],
                    b: +paras[2],
                    c: +paras[4],
                    d: +paras[1],
                    e: +paras[3],
                    f: +paras[5]
                };

                proj4.defs('EPSGUSER', jpegXML.getElementsByTagName('SRS')[0].textContent);
                EPSGUser = proj4('EPSGUSER');

                var img = new Image();
                img.onload = function() {
                    var ul = TransCoord(formula(paraSet, 0, 0));
                    var lr = TransCoord(formula(paraSet, this.width, this.height));
                    returnData([[ul.y, ul.x], [lr.y, lr.x]], img.src);
                }
                img.src = URL.createObjectURL(new Blob([zip.file(jpeg.name).asArrayBuffer()]));

            }

            reader.readAsArrayBuffer(url);
        } else {

        }
    });
}


function formula(paraSet, xpixel, ypixel) {
    return {
        x: paraSet.a*xpixel + paraSet.b*ypixel + paraSet.c,
        y: paraSet.d*xpixel + paraSet.e*ypixel + paraSet.f
    }
}

function loadEPSG(url, callback) {
    var script = document.createElement('script');
    script.src = url;
    script.onreadystatechange = callback;
    script.onload = callback;
    document.getElementsByTagName('head')[0].appendChild(script);
}

function TransCoord(obj) {
    if(proj4)
        var p = proj4(EPSGUser, EPSG4326 , [parseFloat(obj.x), parseFloat(obj.y)]);
    return {x: p[0], y: p[1]};
}