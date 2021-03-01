const { Sequelize, Model, DataTypes } = require('sequelize');

const options = { logging: false };
const sequelize = new Sequelize("sqlite:db.sqlite", options);

class User extends Model {}
class Quiz extends Model {}

User.init({
    name: {
        type: DataTypes.STRING,
        unique: { msg: "Name already exists" },
        allowNull: false,
        validate: {
            isAlphanumeric: { args: true, msg: "name: invalid characters" }
        }
    },
    age: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
            isInt: true,
            min: { args: [0], msg: "Age: less than 0" },
            max: { args: [140], msg: "Age: higher than 140" }
        }
    }
}, { sequelize });

Quiz.init({
    question: {
        type: DataTypes.STRING,
        unique: { msg: "Quiz already exists" }
    },
    answer: DataTypes.STRING
}, { sequelize });


Quiz.belongsTo(User, {
    as: 'author',
    foreignKey: 'authorId',
    onDelete: 'CASCADE'
});
User.hasMany(Quiz, {
    as: 'posts',
    foreignKey: 'authorId'
});

// N:N relations default is -> onDelete: 'cascade'
User.belongsToMany(Quiz, {
    as: 'fav',
    foreignKey: 'userId',
    otherKey: 'quizId',
    through: 'Favourites'
});
Quiz.belongsToMany(User, {
    as: 'fan',
    foreignKey: 'quizId',
    otherKey: 'userId',
    through: 'Favourites'
});


// Funcionalidad scores
class Score extends Model {}

// Funcionalidad scores
//
// Para que se cree el esqueleto de su migrations hay que ejecutar:
//   npx sequelize migration:create --name CreateScoresTable
//   y luego rellenarlo     
// Para que se cree su tabla hay que ejecutar:
//   npm run migrate_win
Score.init({
    wins: { // Atributo wins de tipo entero que indica el número de quizzes contestados correctamente. No puede ser nulo y debe ser mayor o igual que 0.
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
            isInt: true,
            min: { args: [0], msg: "Score: less than 0" },
        }
    }
}, { sequelize });

User.hasMany(Score, { // Referencia userId al identificador de usuario de la tabla User. User(1)->Score(N)
    as: 'scores',
    foreignKey: 'userId'
});

Score.belongsTo(User, { // Referencia userId al identificador de usuario de la tabla Score. Score(N)->User(1)
    as: 'player',
    foreignKey: 'userId',
    onDelete: 'CASCADE'
});


module.exports = sequelize;