const mysql = require("mysql2");

const pool = mysql.createPool({
    host: '127.0.0.1',
    user: 'root',
    password: 'password',
    database: 'game_stats'
}).promise()


async function getGameSessions() {
    const [rows] = await pool.query("SELECT * FROM game_sessions")
    return rows
}

async function getPlayers() {
    const [rows] = await pool.query("SELECT * FROM players")
    return rows
}

async function createPlayer(player_name, score, fastest_round, game_code) {
    const result = await pool.query(`
    INSERT INTO players (
        player_name, score, fastest_round, session_id, date_played
        ) VALUES (
        ?, ?, ?, (SELECT id FROM game_sessions WHERE game_code = ? ORDER BY completion_date DESC LIMIT 1),  CURDATE());
    `, [player_name, score, fastest_round, game_code])
    return result
}

async function createGameSession(game_code) {
    const result = await pool.query(`
    INSERT INTO game_sessions (game_code, completion_date) VALUES (?, CURDATE());
    `, [game_code])
    return result
}

async function getSessionID(gameCode){
    const [rows] = await pool.query(`SELECT session_id FROM game_sessions WHERE game_code = ? ORDER BY completion_date DESC LIMIT 1`, [gameCode]);
    console.log(rows)
    console.log(rows[0].session_id)
    return rows[0].session_id
}

// const sessionResult = await pool.query(`SELECT session_id FROM game_sessions WHERE game_code = 'VKFU'`);

// async function main() {
//     const code = 'VKFU'
//     const sessionResult = await getSessionID(code)
//     // const last_session_id = sessionResult[0].session_id;
//     const result = await createPlayer('glen', 5, 40, sessionResult);
//     console.log(result)
//     console.log(sessionResult)

// }

// main()

module.exports = {
    getGameSessions,
    getPlayers,
    createPlayer,
    getSessionID,
    createGameSession
};