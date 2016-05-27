<?php

namespace Nysci\Http\Controllers;

use Alchemy\Zippy\Zippy;
use Illuminate\Http\Request;

use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Session;
use Illuminate\Support\Facades\Storage;
use Nysci\Http\Requests;

class ViewerController extends Controller
{
  public function index()
  {
    $client = new \Google_Client();

    $client->setClientId(Config::get('google.client_id'));
    $client->setClientSecret(Config::get('google.client_secret'));
    $client->setRedirectUri(Config::get('google.redirect_uri'));
    $client->setScopes(Config::get('google.drive_scopes'));
    $client->setApplicationName(Config::get('google.application_name'));

    if (isset($_GET['state']) || Session::has('state')) {

      if (Session::has('state')) {
        $state = json_decode(Session::get('state'));
      } else if ($_GET['state']) {
        $state = json_decode($_GET['state']);
      } else {
        exit();
      }
    }

    if (isset($_GET['code']) || Session::has('access_token')) {
      if (isset($_GET['code'])) {
        $client->authenticate($_GET['code']);
        Session::put('access_token', $client->getAccessToken());
      } else
        $client->setAccessToken(Session::get('access_token'));

      $service = new \Google_Service_Drive($client);

      $file_id = $state->ids[0];
      if ($client->isAccessTokenExpired()) {
        $authUrl = $client->createAuthUrl();
        header('Location: ' . $authUrl);
        return;
      }
      Session::forget('state');
      $file_contents = $service->files->get($file_id, array('alt' => 'media' ));
      $work_uri = $this->_publishWork($file_contents, $file_id);
      $this->_serveWork($work_uri);
    } else {
      $authUrl = $client->createAuthUrl();
      header('Location: ' . $authUrl);
      return;
    }
  }

  private function _publishWork($file_contents, $file_id)
  {
    // Save archive to temp location
    $tmp_dir = "tmp/{$file_id}";
    $tmp_file = "{$tmp_dir}/work.zip";
    Storage::put($tmp_file, $file_contents);

    // Load archive
    $zippy = Zippy::load();
    $archive = $zippy->open(storage_path("app/{$tmp_file}"));

    // Extract archive to public location
    $public_path = "work/{$file_id}";
    $public_uri = "/{$public_path}";
    Storage::disk('public_web')->makeDirectory($public_uri, 0755, true, true);
    $public_file_path = Storage::disk('public_web')->getAdapter()->getPathPrefix() . $public_path;

    $archive->extract($public_file_path);
    return $public_uri;
  }

  private function _serveWork($tmp_file)
  {
    Storage::delete($tmp_file);
  }
}
