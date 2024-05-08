import React, { useState, useEffect } from 'react'
import { useParams, Link } from "react-router-dom";
import { api_url } from "../api";


import './Leaderboard.css';

const Leaderboard = ( {onClose} ) => {

    const [sessions, setSessions] = useState(null);
    const [players, setPlayers] = useState(null);
    const [tab, setTab] = useState('players');
    const [filter, setFilter] = useState('off');


    const sessionsURL  = `${api_url}/gamesessions`;
    const playersURL  = `${api_url}/players`;
    const playersBySessionURL  = `${api_url}/gamesessions/players`;

     function fetchLeaderboard() {
        try {
            fetch(sessionsURL)
                .then(response => {
                    if (!response.ok)
                        throw new Error(`Fetch failed with status ${response.status}`);
                    return response
                })
                .then(response => response.json())
                .then(data => {
                    if (!Array.isArray(data))
                        throw new Error(`did not get an array from fetch`);
                    setSessions(data)
                })
             fetch(playersURL)
                .then(response => response.json())
                .then(data => setPlayers(data))
                console.log(players)
        } catch (error) {
            console.error('Error fetching players:', error);
            throw error;
        }
        setFilter("off")
    }

    useEffect(() => {
        fetchLeaderboard()
    }, [])

    if (!sessions || !players)
        return "Loading"

    const handleGameCodeClick = (e) => {

        console.log(e)

        const playersBySession = `${playersBySessionURL}/${e}`

        fetch(playersBySession)
        .then(response => {
            if (!response.ok)
                throw new Error(`Fetch failed with status ${response.status}`);
            return response
        })
        .then(response => response.json())
        .then(data => {
            if (!Array.isArray(data))
                throw new Error(`did not get an array from fetch`);
            setPlayers(data)
        })
        setTab("players");
        setFilter("on")
    }

    // Formats the date to DD-MM-YYYY

    const formatDate = (dateString) => {

        const date = new Date(dateString);
    
        const formattedDate = date.toLocaleDateString('en-gb', { weekday:"short", year:"numeric", month:"short", day:"numeric"});
    
        return formattedDate;
    };

    const playerItems = players.map((player) => {

        const formattedDatePlayed = formatDate(player.date_played);

        return ( 
                <tr key={player.player_id}>
                    <td>{player.player_name}</td>
                    <td>{player.fastest_round} sec(s)</td>
                    <td>{player.score}</td>
                    <td>{formattedDatePlayed}</td>
                </tr>
        )
    });

    const sessionItems = sessions.map((session) => {

        const formattedDatePlayed = formatDate(session.completion_date);

        return ( 
                <tr key={session.id}>
                    <td>
                        <button onClick={() => {handleGameCodeClick(session.id)}}>
                            <div>
                            {session.game_code}
                            </div>
                        </button>
                    </td>
                    <td>{formattedDatePlayed}</td>
                </tr>
        )
    });

    const handleBackBtnClick = () => {
        fetchLeaderboard()
        setTab("game_sessions")
    }

    return (
        <div className='modal-overlay'>
        <div className='modal'>

        <div className='HomeLink'>
        <button className="closeBtn" onClick={onClose}>X</button>
        </div>
            {filter === "off" 
            ?
            <div className="buttons">
            <button className='Btn' onClick={() => {setTab("players");}}>Scores</button>
            <button className='Btn' onClick={() => {setTab("game_sessions");}}>Game History</button>
            </div>
            : null}
            {filter === "on"
            ?
            <div className="BackBtnDiv">
             <button className='BackBtn' onClick={() => {handleBackBtnClick();}}>Back</button>
             </div>
             : null}
            <div className="leaderboard">
                <div className="scrolldiv">
                {tab === "players"
                    ?
                    <table>
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Fastest Round</th>
                                <th>Score</th>
                                <th>Date Played</th>
                            </tr>
                        </thead>
                        <tbody>
                            {playerItems}
                            {playerItems}
                            {playerItems}


                        </tbody>
                    </table>
                    : null }
                    {tab === "game_sessions"
                    ?
                    <table>
                        <thead>
                            <tr>
                                <th>Game Code</th>
                                <th>Date Played</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sessionItems}
                            
                        </tbody>
                    </table>
                    : null}
                </div>
            </div>
            </div>
        </div>
    );
}

export default Leaderboard