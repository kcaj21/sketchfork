CREATE DATABASE game_stats;
USE game_stats;

DROP TABLE IF EXISTS players;
DROP TABLE IF EXISTS game_sessions;

CREATE TABLE game_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    game_code VARCHAR(255) NOT NULL,
    completion_date DATE NOT NULL
);

CREATE TABLE players (
    player_id INT AUTO_INCREMENT PRIMARY KEY,
    player_name VARCHAR(255) NOT NULL,
    score INT NOT NULL,
    fastest_round INT NOT NULL,
    session_id INT,
    date_played DATE NOT NULL,
    FOREIGN KEY (session_id) REFERENCES game_sessions(id)
);



INSERT INTO game_sessions (game_code, completion_date) VALUES ('VKFU', CURDATE());
INSERT INTO players (
    player_name, score, fastest_round, session_id, date_played
    ) VALUES (
    'alice', 5, 30, (SELECT id FROM game_sessions WHERE game_code = 'VKFU' ORDER BY completion_date DESC LIMIT 1),  NOW());
INSERT INTO players (player_name, score, fastest_round, session_id, date_played) VALUES ('john', 5, 40, (SELECT id FROM game_sessions WHERE game_code = 'VKFU' ORDER BY completion_date DESC LIMIT 1),  NOW());


--leaderboard table: player, highscore, no. of games won, fastest draw round