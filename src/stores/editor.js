import {EventEmitter} from 'events';
import _assign from 'object-assign';
import eventConstants from '../constants/events';
import appDispatcher from '../dispatcher/app-dispatcher';
import fs from 'fs';
import reduxStore from './redux';
import {recursive} from 'merge';

function exportDefaults() {
  return {
    width: 300,
    height: 300,
    files: [],
    animations: {}
  }
}

function stateDefaults() {
  return {
    isPlaying: false,
    frameTimer: false,
    selections: {
      selectedFile: null,
      selectedFrame: null,
      selectedAnimation: null
    }
  };
}

var exportValues = exportDefaults();
var state = stateDefaults();

var editorStore = _assign({}, EventEmitter.prototype, {
  addChangeListener(callback) {
    this.addListener(eventConstants.CHANGE, callback);
  },

  removeChangeListener() {
    this.removeListener(eventConstants.CHANGE, callback);
  },

  getIsPlaying() {
    return state.isPlaying;
  },

  getFramesForSelectedAnimation() {
    return exportValues.animations[state.selections.selectedAnimation] || [];
  },

  getSelectedFrame() {
    return state.selections.selectedFrame;
  },

  getFiles() {
    return exportValues.files;
  },

  getSelectedFile() {
    return state.selections.selectedFile;
  },

  getWidth() {
    return exportValues.width;
  },

  getHeight() {
    return exportValues.height;
  },

  getSnapshot() {
    return {...exportValues}
  },

  getAnimations() {
    return Object.keys(exportValues.animations);
  },

  getFramesForAnimation(animation) {
    return exportValues.animations[animation];
  },

  getSelectedAnimation() {
    return state.selections.selectedAnimation;
  },

  getExportObject() {
    return exportValues;
  }
});

var change = function() {
  editorStore.emit(eventConstants.CHANGE);
};

var togglePlaying = function() {
  state.isPlaying = !state.isPlaying;
  if (state.isPlaying) {
    setupTimer();
  } else {
    clearInterval(state.frameTimer);
  }
};

var setupTimer = function() {
  var frames = editorStore.getFramesForSelectedAnimation();

  state.frameTimer = setTimeout(() => {
    var selectedFrameIndex = frames.indexOf(state.selections.selectedFrame);
    if (selectedFrameIndex === frames.length - 1) {
      state.selections.selectedFrame = frames[0];
    } else {
      state.selections.selectedFrame = frames[selectedFrameIndex + 1];
    }

    change();
    setupTimer();
  }, editorStore.getSelectedFrame().duration);
};

var defaultFrame = () => {
  let frame = {
    duration: 500,
    files: {}
  };
  editorStore.getFiles().forEach((file) => {
    frame.files[file] = {
      top: 0,
      left: 0,
      rotation: 0,
      visible: true
    }
  });

  return frame;
};

var handleAddFrame = () => {
  var selectedAnimation = exportValues.animations[state.selections.selectedAnimation];
  var lastFrameInAnimation = selectedAnimation[selectedAnimation.length - 1];
  var newFrame = lastFrameInAnimation ? JSON.parse(JSON.stringify(lastFrameInAnimation)) : defaultFrame();
  selectedAnimation.push(newFrame);
  state.selections.selectedFrame = newFrame;
};

editorStore.dispatchToken = appDispatcher.register(payload => {
  var action = payload.action;
  var fileIndex;
  if (state.selections.selectedFrame && state.selections.selectedFrame.files && editorStore.getSelectedFile()) {
    var fileFrame = state.selections.selectedFrame.files[exportValues.files.indexOf(editorStore.getSelectedFile())];
  }

  switch (action.actionType) {
    case eventConstants.ADD_FRAME:
      handleAddFrame();
      change();
      break;
    case eventConstants.DELETE_FRAME:
      var animation = exportValues.animations[state.selections.selectedAnimation];
      exportValues.animations[state.selections.selectedAnimation] = animation.filter((frame)=> {
        return frame !== action.data;
      });
      if (state.selections.selectedFrame === action.data) {
        state.selections.selectedFrame = animation[animation.length - 1];
      }
      change();
      break;
    case eventConstants.SELECT_FRAME:
      state.selections.selectedFrame = action.data;
      change();
      break;
    case eventConstants.SET_LEFT_FOR_SELECTED_FILE_FRAME:
      fileFrame.left = parseInt(action.data) || 0;
      change();
      break;
    case eventConstants.SET_ROTATION_FOR_SELECTED_FILE_FRAME:
      fileFrame.rotation = parseInt(action.data) || 0;
      change();
      break;
    case eventConstants.SET_TOP_FOR_SELECTED_FILE_FRAME:
      fileFrame.top = parseInt(action.data) || 0;
      change();
      break;
    case eventConstants.DECREMENT_TOP_FOR_SELECTED_FILE_FRAME:
      fileFrame.top--;
      change();
      break;
    case eventConstants.INCREMENT_TOP_FOR_SELECTED_FILE_FRAME:
      fileFrame.top++;
      change();
      break;
    case eventConstants.DECREMENT_LEFT_FOR_SELECTED_FILE_FRAME:
      fileFrame.left--;
      change();
      break;
    case eventConstants.INCREMENT_LEFT_FOR_SELECTED_FILE_FRAME:
      fileFrame.left++;
      change();
      break;
    case eventConstants.ROTATE_LEFT_FOR_SELECTED_FILE_FRAME:
      fileFrame.rotation--;
      change();
      break;
    case eventConstants.ROTATE_RIGHT_FOR_SELECTED_FILE_FRAME:
      fileFrame.rotation++;
      change();
      break;
    case eventConstants.SET_DURATION_FOR_SELECTED_FRAME:
      state.selections.selectedFrame.duration = action.data;
      change();
      break;
    case eventConstants.SET_VISIBILITY_FOR_SELECTED_FILE_FRAME:
      fileFrame.visible = action.data;
      change();
      break;
    case eventConstants.TOGGLE_VISIBILITY_FOR_SELECTED_FILE_FRAME:
      fileFrame.visible = !fileFrame.visible;
      change();
      break;
    case eventConstants.DELETE_ANIMATION:
      var animations = Object.keys(exportValues.animations);
      var index = animations.indexOf(action.data);

      if (index !== -1) {
        let containsSelectedFrame = exportValues.animations[action.data].indexOf(state.selections.selectedFrame) !== -1;
        delete exportValues.animations[action.data];
        animations.splice(index, 1);

        if (index === animations.length) {
          state.selections.selectedAnimation = animations[animations.length - 1];
        } else {
          state.selections.selectedAnimation = state.selections.animations[index];
        }

        if (containsSelectedFrame) {
          state.selections.selectedFrame = exportValues.animations[state.selections.selectedAnimation][0];
        }

        change();
      }

      break;
    case eventConstants.TOGGLE_PLAYING:
      togglePlaying();
      change();
      break;
    case eventConstants.RENAME_ANIMATION:
      exportValues.animations[action.data.newName] = exportValues.animations[action.data.oldName];
      delete exportValues.animations[action.data.oldName];
      if (state.selections.selectedAnimation = action.data.oldName) {
        state.selections.selectedAnimation = action.data.newName;
      }

      change();
      break;
    case eventConstants.SELECT_ANIMATION:
      state.selections.selectedAnimation = action.data;
      state.selections.selectedFrame = editorStore.getFramesForSelectedAnimation()[0];
      change();
      break;
    case eventConstants.RESET:
      exportValues = exportDefaults();
      state = stateDefaults();
      change();
      break;
    case eventConstants.IMPORT_STATE:
      exportValues = action.data;
      state.selections.selectedFile = editorStore.getFiles()[0];
      state.selections.selectedAnimation = editorStore.getAnimations()[0];
      state.selections.selectedFrame = exportValues.animations[state.selections.selectedAnimation][0]
      change();
    default:
      return true;
  }
});

reduxStore.subscribe(() => {
  let reduxState = reduxStore.getState();
  exportValues = recursive(exportValues, reduxState.exportValues);
  state.selections = {...state.selections, ...reduxState.selections};
  change();
});

export default editorStore;
