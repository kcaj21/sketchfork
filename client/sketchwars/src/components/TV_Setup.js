import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import './TV_Setup.css'

const TV_Setup = ({ gameState }) => {

  const navigate = useNavigate();
  const handleClose = () => navigate('/');

  return (
    <div className="modal-overlay tv-setup">
      <div className="modal">
        <div className="header">
          <h2 id="title">Setup</h2>
          <button className="closeBtn" onClick={handleClose} >X</button>
        </div>
        {!gameState.Tablet ? (
          <>
            <h2 className="instruction">On your tablet, join</h2>
            <h2 className="room">{gameState.gameCode}</h2>
          </>
        ) : (
          <>
            <h2 className="instruction">Tablet connected. Now choose your teams and hit START</h2>
            <div className="grid-container">
              <div className="red-column">
                <h3 className="red-font">Red Team</h3>
                {gameState.redTeam.map((player, index) => (
                  <p key={index}>{player.name}</p>
                ))}
              </div>
              <div className="blue-column">
                <h3 className="blue-font">Blue Team</h3>
                {gameState.blueTeam.map((player, index) => (
                  <p key={index}>{player.name}</p>
                ))}
              </div>
            </div>
          </>
        )}


      </div>
    </div>
  );
};

export default TV_Setup;
