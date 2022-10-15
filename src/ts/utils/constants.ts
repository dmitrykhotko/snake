// DEV SETTINGS

import { PlayerMode } from './enums';

export const TRACE_STATE = false;

// GAME DEFAULTS

export const CELL_SIZE = 15;
export const LINE_HEIGHT = 60;

export const SNAKE_LENGTH = 30;

export const FPS = 30; // Valid values are 60,30,20,15,10...
export const SNAKE_SPEED = 1;
export const BULLET_SPEED = 2;

export const HEAD_SHOT_AWARD = 25;
export const KILL_AWARD = 10;
export const BODY_PART_HIT_WEIGHT = 0.5;
export const BODY_PART_RAM_WEIGHT = 0.5;
export const FRIENDLY_FIRE_WEIGHT = 0.5;
export const SYM_DAMAGE_WEIGHT = 0.75;

export const RESPAWN_DELAY = 30;

export const LIVES = 2;
export const PLAYER_MODE = PlayerMode.Multiplayer;

// ACTIONS

//// COMMON_ACTIONS

export const GAME_RESET = 'COMMON_ACTIONS/GAME_RESET';

//// ARENA ACTIONS
export const SET_COIN = 'ARENA/SET_COIN';
export const SET_GAME_STATUS = 'ARENA/SET_GAME_STATUS';

//// USER SETTINGS ACTIONS

export const SET_PLAYER_MODE = 'USER_SETTINGS/SET_PLAYER_MODE';
export const SET_ARENA_TYPE = 'USER_SETTINGS/SET_ARENA_TYPE';
export const SET_DRAW_GRID = 'USER_SETTINGS/SET_DRAW_GRID';
export const SET_LIVES = 'USER_SETTINGS/SET_LIVES';

//// INPUT ACTIONS

// export const SET_DIRECTION = 'INPUT/SET_DIRECTION';
export const SET_INPUT = 'INPUT/SET_INPUT';
export const GAME_START = 'INPUT/GAME_START';
export const GAME_PAUSE = 'INPUT/GAME_PAUSE';

//// SNAKES ACTIONS

export const SET_SNAKE = 'SNAKES/SET_SNAKE';
export const REMOVE_SNAKE = 'SNAKES/REMOVE_SNAKE';
export const SET_HEAD = 'SNAKES/SET_HEAD';
export const SET_TAIL = 'SNAKES/SET_TAIL';
export const NEW_DIRECTION = 'SNAKES/NEW_DIRECTION';

//// BULLETS ACTIONS

export const SET_BULLET = 'BULLETS/SET_BULLET';
export const REMOVE_BULLET = 'BULLETS/REMOVE_BULLET';
export const RESET_BULLETS = 'BULLETS/RESET_BULLETS';

//// BIN ACTIONS

export const MOVE_TO_BIN = 'BIN/MOVE_TO_BIN';
export const EMPTY_BIN = 'BIN/EMPTY_BIN';

//// STAT ACTIONS

export const INC_SCORE = 'STAT/INC_SCORE';
export const ADD_SCORE = 'STAT/ADD_SCORE';
export const SET_WINNERS = 'STAT/SET_WINNERS';
export const SET_SCORE = 'STAT/SET_SCORE';
export const DEC_LIVES = 'STAT/DEC_LIVES';
