import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from "react-router-dom";
import { api_url } from "../api";

import './Leaderboard.css';

const Leaderboard = () => {

    const [sessions, setSessions] = useState(null);
    const [players, setPlayers] = useState(null);
    const [tab, setTab] = useState('players');

    const sessionsURL  = `${api_url}/game_sessions`;
    const playersURL  = `${api_url}/players`;

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
    }

    useEffect(() => {
        fetchLeaderboard()
    }, [])

    if (!sessions || !players)
        return "Loading"


    // Format the date to DD-MM-YYYY

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
                    <td>{session.game_code}</td>
                    <td>{formattedDatePlayed}</td>
                </tr>
        )
    });

    return (
        <div>
            <div className="buttons">
            <button className='Btn' onClick={() => {setTab("players");}}>Scores</button>
            <button className='Btn' onClick={() => {setTab("game_sessions");}}>Game History</button>
            </div>
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
                        </tbody>
                    </table>
                    :
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
                    }
                </div>
            </div>
        </div>
    );
}

export default Leaderboard