DROP TABLE IF EXISTS `user`;
DROP TABLE IF EXISTS `shares`;

CREATE TABLE `user`
(
    `id`        int(10) unsigned NOT NULL AUTO_INCREMENT COMMENT 'User ID',
    `passport`  varchar(45) NOT NULL COMMENT 'User Passport',
    `password`  varchar(45) NOT NULL COMMENT 'User Password',
    `nickname`  varchar(45) NOT NULL COMMENT 'User Nickname',
    `create_at` datetime DEFAULT NULL COMMENT 'Created Time',
    `update_at` datetime DEFAULT NULL COMMENT 'Updated Time',
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE `shares`
(
    `id`        int(10) unsigned NOT NULL AUTO_INCREMENT COMMENT 'Share ID',
    `passport`  varchar(45) NOT NULL COMMENT 'User Passport',
    `share`   varchar(64) NOT NULL COMMENT 'Share Content',
    `create_at` datetime DEFAULT NULL COMMENT 'Created Time',
    `update_at` datetime DEFAULT NULL COMMENT 'Updated Time',
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

