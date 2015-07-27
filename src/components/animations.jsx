import React from'react';
import animationStore from'../stores/animations';
import animationActions from'../actions/animations';
import _assign from'object-assign';
import RenameModal from './rename-modal';
import ContextMenu from './context-menu';
import contextMenuActions from '../actions/context-menu';

var Animations = React.createClass({
  getInitialState() {
    return {
      animations: animationStore.getAnimations(),
      selectedAnimation: animationStore.getSelectedAnimation(),
      renaming: false,
      contextMenuOpen: false
    };
  },

  _updateAnimationStoreState() {
    this.setState({
      animations: animationStore.getAnimations(),
      selectedAnimation: animationStore.getSelectedAnimation()
    });
  },

  componentDidMount() {
    animationStore.addChangeListener(this._updateAnimationStoreState);
  },

  componentWillUnmount() {
    animationStore.removeChangeListener(this._updateAnimationStoreState);
  },

  render() {
    var animations = this.state.animations.map((animation) => {
      var style = {
        backgroundColor: animation === this.state.selectedAnimation ? '#29516d' : undefined
      };

      return <div style={style} onClick={this._handleSelectAnimation.bind(this, animation)} onContextMenu={this._handleContextMenu.bind(this, animation)}>{animation}</div>;
    });

    var style = _assign({}, this.props.style);
    return (
      <div style={style}>
        <div>Animations <a onClick={this._handleAddAnimation}>+</a></div>
        {animations}
        {this.state.renaming ? <RenameModal value={this.state.selectedAnimation} onChange={this._handleAnimationNameChange}/> : null}
        <ContextMenu/>
      </div>
    );
  },

  _handleAddAnimation() {
    animationActions.addAnimation();
  },

  _handleAnimationNameChange(newAnimationName) {
    animationActions.renameAnimation(this.state.selectedAnimation, newAnimationName);
    this.setState({
      renaming: false
    });
  },

  _handleSelectAnimation(animation) {
    animationActions.selectAnimation(animation);
  },

  _handleContextMenu(animation, event) {
    contextMenuActions.openContextMenu([{
      display: 'Rename',
      onClick: () => {
        this.setState({
          renaming: true
        });
      }
    }], event);
  }
});

export default Animations;
