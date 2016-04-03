<?php
    // From "Javascript Programming For Twitter API 1.1"
    // Make sure search terms were sent
    if (!empty($_GET['q'])) {
    // Strip any dangerous text out of the search
    $search_terms = htmlspecialchars($_GET['q']);

    $count = 100;
    if (!empty($_GET['count'])) {
        $count = $_GET['count'];
    }

    // Create an OAuth connection
    require 'app_tokens.php';
    require 'tmhOAuth.php';
    $connection = new tmhOAuth(array(
     'consumer_key' => $consumer_key,
     'consumer_secret' => $consumer_secret,
     'user_token' => $user_token,
     'user_secret' => $user_secret
    ));
    // Run the search with the Twitter API
    $http_code = $connection->request('GET',$connection->url('1.1/search/tweets'),
     array('q' => $search_terms,
     'count' => $count,
     'lang' => 'en',
    'type' => 'recent'));
    // Search was successful
    if ($http_code == 200) {
    // Extract the tweets from the API response
    $response = json_decode($connection->response['response'],true);
    $tweet_data = $response['statuses'];
    // Accumulate tweets from search results
    $tweet_stream = '';
    foreach($tweet_data as $tweet) {
    // Ignore retweets
    if (isset($tweet['retweeted_status'])) {
    continue;
    }
    // Add this tweet's text to the results
    $tweet_stream .= $tweet['text'] . '<br/>';
    }
    // Send the result tweets back to the Ajax request
    print $tweet_stream;
    // Handle errors from API request
    } else {
    if ($http_code == 429) {
    print 'Error: Twitter API rate limit reached';
    } else {
    print 'Error: Twitter was not able to process that search';
    }
    }
    } else {
    print 'No search terms found';
    }
?>