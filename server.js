'use strict';

const port = process.env.PORT || 3000;

const express    = require( "express" );
const bodyparser = require( "body-parser" );
const exphbs     = require( "express-handlebars" );
const mongoose   = require( "mongoose" );
mongoose.Promise = require( 'bluebird' );
const cheerio    = require( "cheerio" );
const request    = require( "request" );

const app = express();

app.engine('handlebars', exphbs({defaultLayout: 'main'}));
app.set('view engine', 'handlebars');

mongoose.connect('mongodb://localhost/newsflash', { useMongoClient: true });

var Item = mongoose.model('Item', { 
    title: String, 
    link: String,
    comment: String
});

const item = new Item( { title: "Some title", link: "http://www.google.com", comment: "This is my comment." } );

// item.save( function(err) {
//     if ( err ) throw err;

//     console.log( item );
// })

// Item.find( {}, function( err, item ) {
//     console.log( "Found item: ", item );
// })

app.get( "/", function( req, res ) {
    Item.find({}, function( err, itemList) {
        if ( err ) throw err;
        console.log( "itemList:", itemList );
        res.render( "list", {
            data: itemList
        })
    });
});

app.get( "/getnews", function( req, res ) {
    console.log( "Scraping articles." );

    Item.remove({}, function(err, removed) {
        console.log( "Items removed = " + removed );
        const statusCode = getNewArticles();
        res.json( { status: statusCode } ); 
    })   
});

app.listen( port, function( ) {
    console.log( "Listening on " + port );
})


function getNewArticles() {

    request("https://news.ycombinator.com/", function(error, response, html) {
        console.log( response.statusCode );

        const $ = cheerio.load( html );

        $(".title").each( function( i, entry ) {
            const title = $(this).children("a").text();
            if ( title ) {;
                // console.log( title );
                var link = $(this).children("a").attr("href");
                //console.log( link );
                const item = new Item( { title: title, link: link } );
                item.save( function(err) {
                    if ( err ) throw err;
                    //console.log( item );
                })
            }
        })
        return( response.statusCode );
    })  
}