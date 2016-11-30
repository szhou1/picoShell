const React = require('react');
const ReactDOM = require('react-dom');
const NewVideoForm = require('./NewVideoForm.jsx');
const VideoTable = require('./VideoTable.jsx');
const VideoPage = require('./VideoPage.jsx');
const utils = require('../../utils/videoHelpers.js');
const bootstrap = require('bootstrap');
const API_KEY = process.env.API_KEY;
const NavBar = require('./NavBar.jsx');
const VideoSearch = require('./VideoSearch.jsx');
const VideoSearchResults = require('./VideoSearchResults.jsx');
const axios = require('axios');

class VideoHome extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      videoList: [],
      myVideos: [],
      searchResults: []
    };

    this.searchQuery = '';
  }

  componentWillMount() {
    var context = this;
    const user = JSON.parse(localStorage['user']);
    context.setState({
      containerName: user.username,
      username: user.username
    });
  }

  componentDidMount() {
    const context = this;

    axios.get('/videos/getVideos')
      .then(function(res) {
        console.log('these are the videos', res);
        const videos = utils.getAllVideoObjects(res.data);
        context.setState({ videoList: videos });
      })
      .catch(function(err) {
        console.error('Failed to fetch videos from database', err);
      });

    axios.get('/videos/getMyVideos', 
      { params: {
          userId: context.state.username }
      })
      .then(function(res) {
        console.log('my videos', res);
        const videos = utils.getAllVideoObjects(res.data);
        context.setState({ myVideos: videos });
      })
      .catch(function(err) {
        console.error('Failed to fetch my videos from database', err);
      });
  }

  render() {
    return (
      <div className="video-home-page">
        <NavBar username={this.state.username}/>
        <div className="video-homepage-container">
          <div className="homepage-landing">
            <div className="overlay">
              <div className="row">
                <div className="col-md-4 col-md-offset-4 homepage-form">
                  <VideoSearch handleVideoSearch={this.handleVideoSearch.bind(this)} 
                    handleVideoSearchInputChange={this.handleVideoSearchInputChange.bind(this)} />
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="video-search-results-container">
          <div className="row">
            <VideoSearchResults videos={this.state.searchResults} 
            handleSearchedVideoClick={this.handleSearchedVideoClick.bind(this)} />
          </div>
        </div>
        <div className="video-table-container">
          <span className="video-section-title">My Videos</span>
          <div className="container">
            <VideoTable onVideoClick={this.handleVideoClick.bind(this)}videos={this.state.myVideos}/>
          </div>
        </div>
        <div className="video-table-container">
          <span className="video-section-title">Trending</span>
          <div className="container">
            <VideoTable onVideoClick={this.handleVideoClick.bind(this)}videos={this.state.videoList}/>
          </div>
        </div>
      </div>
    );
  }

  handleVideoSearch(e) {
    e.preventDefault();
    const context = this;
    // console.log('handleVideoSearch', e, e.target.value);
    // console.log('api key', API_KEY);
    if(!context.searchQuery.trim()) {
      return;
    }

    const options = {
      part: 'snippet',
      maxResults: 3,
      q: context.searchQuery,
      type: 'video',
      key: API_KEY
    }

    // const options = {
    //   part: 'statistics',
    //   metrics: 'views,comments,likes,dislikes,shares',
    //   max: 3,
    //   key: API_KEY
    // }

    console.log(options)
    axios.get('https://www.googleapis.com/youtube/v3/search?', 
      {params: options })
      .then(function(res) {
        console.log(res.data.items);
        return res.data.items;
      })
      .then(function(videos) {
        console.log(videos);
        context.setState({ searchResults: videos });
        context.searchQuery = '';

      })
      .catch(function(err, msg) {
        console.error(err);
        console.error(msg);
      });

  }

  handleVideoSearchInputChange(e) {
    e.preventDefault();
    this.searchQuery = e.target.value;
  }

  handleSearchedVideoClick(video) {
    console.log('handleSearchedVideoClick', video);
    this.addVideoToCollection(video);
  }

  addVideoToCollection(video) {
    const context = this;

    axios.post('/videos/addVideoToGlobalList', {video: video})
      .then(function(res) {
        const videoFromDB = res.data[0];
        const created = res.data[1];

        if(created) {
          const videos = context.state.videoList.slice();
          videos.push(videoFromDB);
          context.setState({ videoList: videos });
        }

        return videoFromDB;
      })
      .then(function(newVideo) {
        context.addVideoToPersonalList(newVideo);
      })
      .catch(function(err) {
        console.log('Unable to add to global list', err);
      });
  }

  addVideoToPersonalList(video) {
    const context = this;
    // console.log(video);

    axios.post('/videos/addVideoToPersonalList', 
      { userId: context.state.username,
        videoId: video.videoId })
      .then(function(res) {
        const videoFromDB = res.data[0];
        const created = res.data[1];

        if(created) {
          // console.log('Successfully added video to PERSONAL collection');
          const videos = context.state.myVideos.slice();
          videos.push(video);
          context.setState({ myVideos: videos });
        }

      })
      .catch(function(err) {
        console.error(err);
      })
  }

  handleVideoClick(video) {
    axios.post('/videos/incrementVideoClickCounter', {videoId: video.videoId})
      .then(function(res) {
        console.log('Successfully incremented the counter');
      })
      .catch(function(err) {
        console.error(err);
      })
  }
}

module.exports = VideoHome;
