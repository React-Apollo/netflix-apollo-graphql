import 'rxjs';
import NavigationReducer from '../reducers/navReducer';
import { combineReducers, createStore, applyMiddleware } from 'redux';
import { enableBatching } from 'redux-batched-actions';

import {
  reducers as apiReducers,
  middleware as apiMiddleware,
} from 'redux-api-call';
import { combineEpics, createEpicMiddleware } from 'redux-observable';
import { reducer as modal } from 'redux-modal';
import { compose } from 'recompose';

import Details, {
  HOCMakeFetchAction,
  isShowPopupDetail as selectedMovieID,
} from '../components/Details/state';
import Player, {
  fetchEspisodeAction,
  currentPlayedMovieSelector as currentEpisodeID,
  fetchDetailsEspisodes,
  pauseCurrentMovie,
  playCurrentMovie,
} from '../components/Player/state';


const openDetailsEpic = (actions$, { getState }) =>
  actions$.ofType('SHOW_DETAILS').map(() => {
    const movieID = selectedMovieID(getState());
    const { fetchMovieDetails } = HOCMakeFetchAction(movieID);
    return fetchMovieDetails();
  });

const fetchEpisodesWhenPlayEpic = (actions$, { getState }) =>
  actions$.ofType('PLAY_MOVIE').map(fetchDetailsEspisodes);

const playerDetailsEpic = (actions$, { getState }) =>
  actions$.ofType('PLAY_MOVIE').map(() => {
    const state = getState();
    const movieID = currentEpisodeID(state);
    const { fetchEspisode } = fetchEspisodeAction(movieID);
    return fetchEspisode(movieID);
  });

const pausePlayerWhenOpenEpisode = actions$ =>
  actions$.ofType('OPEN_EPISODES').map(pauseCurrentMovie);

const playPlayerWhenCloseEpisode = actions$ =>
  actions$.ofType('CLOSE_EPISODES').map(playCurrentMovie);

const rootEpic = combineEpics(
  openDetailsEpic,
  playerDetailsEpic,
  fetchEpisodesWhenPlayEpic,
  pausePlayerWhenOpenEpisode,
  playPlayerWhenCloseEpisode
);

 const epicMiddleware = createEpicMiddleware(rootEpic);

 const middlewares = applyMiddleware(apiMiddleware, epicMiddleware);

 const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;

const store = createStore(
  enableBatching(
   combineReducers({
     ...NavigationReducer,
      ...apiReducers,
      ...Details,
      ...Player,
      modal,
   })
 ),
  {},
  composeEnhancers(middlewares)
);


export default store;
