<?php
namespace Nysci\Services;

/**
 * Created by PhpStorm.
 * User: lazar
 * Date: 5/25/16
 * Time: 10:09 PM
 */
class GoogleDrive
{
    protected $client;

    protected $service;

    // http://stackoverflow.com/questions/25707891/google-drive-php-api-simple-file-upload
    function __construct()
    {
        $this->client = new \Google_Client();

        $this->client->setClientId(Config::get('google.client_id'));
        $this->client->setClientSecret(Config::get('google.client_secret'));
        $this->client->setRedirectUri(Config::get('google.redirect_uri'));
        $this->client->setScopes(Config::get('google.drive_scopes'));

        $this->client->setApplicationName(Config::get('google.application_name'));

        $this->service = new \Google_Service_Drive($this->client);

        /* If we have an access token */
        if (Cache::has('service_token')) {
            $this->client->setAccessToken(Cache::get('service_token'));
        }

        $key = file_get_contents($key_file_location);

        $cred = new \Google_Auth_OAuth2(
            $service_account_name,
            ,
            $key
        );

        $this->client->setAssertionCredentials($cred);
        if ($this->client->getAuth()->isAccessTokenExpired()) {
            $this->client->getAuth()->refreshTokenWithAssertion($cred);
        }
        Cache::forever('service_token', $this->client->getAccessToken());
    }

    public function get($calendarId)
    {
        $results = $this->service->calendars->get($calendarId);
        dd($results);
    }
}