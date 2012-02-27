#!/usr/bin/env perl
use Mojolicious::Lite;
use Mojo::UserAgent;
use Mojo::ByteStream 'b';
use Mojo::JSON;
use utf8;


my $clients = {};

get '/' => sub {
  my $self = shift;
  
  $self->render('index');
};

any '/save' => sub {
    my $self = shift;
    my $ua = Mojo::UserAgent->new;
    my $url = $self->param('url');
    my $subtitle;

    app->log->debug(sprintf 'Got URL: %s', $url);
    my $response = $ua->get($url);
    if ($response->res->headers->content_type =~ /text\/html/) {
        $subtitle = $response->res->dom->at('title')->text;
    } else {
        $subtitle = $response->res->headers->content_type;
    }
    $url = b($url)->html_escape;

    my $json = Mojo::JSON->new;
    for (keys %$clients) {
        $clients->{$_}->send_message(
            b($json->encode({
                url => $url,
                subtitle => $subtitle,
            }))->decode('utf-8')->to_string
        );
    }

    $self->render(text => "Thanks for $url ");
};

websocket '/ws' => sub {
    my $self = shift;

    app->log->debug(sprintf 'WS Client connected: %s', $self->tx);
    my $id = sprintf '%s', $self->tx;
    $clients->{$id} = $self->tx;

    $self->on(finish =>
        sub {
            app->log->debug('WS Client disconnected');
            delete $clients->{$id};
        });
};


app->start;
__DATA__

@@ index.html.ep
% layout 'upload', title => 'wShare :: Upload';


@@ layouts/upload.html.ep
<!DOCTYPE html>
<html>
    <head>
        <title><%= title %></title>
        <link rel="stylesheet" type="text/css" href="css/bootstrap.css" />
        <link rel="stylesheet" type="text/css" href="css/style.css" />

        <script type="text/javascript" src="js/jquery-1.7.1.js" ></script>
        <script type="text/javascript" src="js/bootstrap.js" ></script>
        <script type="text/javascript" src="js/wshare.js"></script>   
    
        <meta charset="UTF-8">
    </head>
    <body>
        <div class="container">
            <h1 id="wshare_header">wShare</h1>
            <div class="row">
                <div class="span6 offset3" id="wshare_inputcontainer">
                    <form class="well form-inline" method="post" action="save">
                        <div class="control-group">
                            <input class="span4" type="text" name="wshare_url" id="wshare_url" placeholder="http://example.org" autofocus />
                            <button type="submit" class="btn btn-primary" id="wshare_submit" data-loading-text="Loading">Submit</button>
                        </div>
                    </form>
                </div>
            </div>
            <div class="row" id="wshare_contentcontainer">
                <div class="well span8 offset2" id="wshare_things">
                    <div class="thing" id="wshare_thinghidden">
                        <p class="url">
                        </p>
                        <p class="subtitle"></p>
                    </div>
                    
                </div>
            </div>
            <div class="row">
                <div id="wshare_navigation">
                    <a href="#">&laquo; Newer</a> <a href="#">Older &raquo;</a>
                </div>
            </div>
            <div class="row">
                <div id="wshare_wsinfo"></div>
            </div>
        </div>
    </body>
</html>
