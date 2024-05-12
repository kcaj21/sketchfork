CREATE DATABASE game_stats;
USE game_stats;

DROP TABLE IF EXISTS players;
DROP TABLE IF EXISTS game_sessions;

CREATE TABLE game_sessions (
    session_id INT AUTO_INCREMENT PRIMARY KEY,
    game_code VARCHAR(255) NOT NULL,
    red_score INT,
    blue_score INT,
    completion_date DATE NOT NULL
);

CREATE TABLE players (
    player_id INT AUTO_INCREMENT PRIMARY KEY,
    player_name VARCHAR(255) NOT NULL,
    score INT NOT NULL,
    fastest_round INT NOT NULL,
    session_id INT,
    date_played DATE NOT NULL,
    FOREIGN KEY (session_id) REFERENCES game_sessions(session_id)
);