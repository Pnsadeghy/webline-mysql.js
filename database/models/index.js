'use strict';

const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const env = process.env.APP_DEBUG || 'development';
const config = require(__dirname + '/../config.js')[env];
const db = {};

let sequelize;
if (config['use_env_variable']) {
    sequelize = new Sequelize(process.env[config['use_env_variable']], config);
} else {
    sequelize = new Sequelize(config.database, config.username, config.password, config);
}

const files = [];
const sortDir = (maniDir) => {
    const folders = [];
    const CheckFile = filePath => (fs.statSync(filePath).isFile());
    const sortPath = (dir) => {
        fs
            .readdirSync(dir)
            .filter(file => (file.indexOf(".") !== 0) && (file !== "index.js"))
            .forEach((res) => {
                const filePath = path.join(dir, res);
                if (CheckFile(filePath)) {
                    files.push(filePath);
                } else {
                    folders.push(filePath);
                }
            });
    };
    folders.push(maniDir);
    let i = 0;
    do {
        sortPath(folders[i]);
        i += 1;
    } while (i < folders.length);
};
['users'].forEach(function (key) {
    sortDir(__dirname + `/../../app_modules/${key}/models`);
});

files
    .forEach((file) => {
        const model = sequelize['import'](file);
        db[model.name] = model;
    });

Object.keys(db).forEach(modelName => {
    if (db[modelName].associate) {
        db[modelName].associate(db);
    }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;
sequelize
    .authenticate()
    .catch(err => {
        console.error('Unable to connect to the sql server:', err);
        process.abort();
    });
module.exports = db;
