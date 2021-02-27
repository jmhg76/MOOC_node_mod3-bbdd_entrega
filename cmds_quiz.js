const { User, Quiz } = require("./model.js").models;

// Para poder especificar filtros
const { Sequelize } = require('sequelize');

// Show all quizes in DB including <id> and <author>
exports.list = async(rl) => {

    let quizes = await Quiz.findAll({
        include: [{
            model: User,
            as: 'author'
        }]
    });
    quizes.forEach(
        q => rl.log(`  "${q.question}" (by ${q.author.name}, id=${q.id})`)
    );
}

// Create quiz with <question> and <answer> in the DB
exports.create = async(rl) => {

    let name = await rl.questionP("Enter user");
    let user = await User.findOne({ where: { name } });
    if (!user) throw new Error(`User ('${name}') doesn't exist!`);

    let question = await rl.questionP("Enter question");
    if (!question) throw new Error("Response can't be empty!");

    let answer = await rl.questionP("Enter answer");
    if (!answer) throw new Error("Response can't be empty!");

    await Quiz.create({
        question,
        answer,
        authorId: user.id
    });
    rl.log(`   User ${name} creates quiz: ${question} -> ${answer}`);
}

// Test (play) quiz identified by <id>
exports.test = async(rl) => {

    let id = await rl.questionP("Enter quiz Id");
    let quiz = await Quiz.findByPk(Number(id));
    if (!quiz) throw new Error(`  Quiz '${id}' is not in DB`);

    let answered = await rl.questionP(quiz.question);

    if (answered.toLowerCase().trim() === quiz.answer.toLowerCase().trim()) {
        rl.log(`  The answer "${answered}" is right!`);
    } else {
        rl.log(`  The answer "${answered}" is wrong!`);
    }
}

// Update quiz (identified by <id>) in the DB
exports.update = async(rl) => {

    let id = await rl.questionP("Enter quizId");
    let quiz = await Quiz.findByPk(Number(id));

    let question = await rl.questionP(`Enter question (${quiz.question})`);
    if (!question) throw new Error("Response can't be empty!");

    let answer = await rl.questionP(`Enter answer (${quiz.answer})`);
    if (!answer) throw new Error("Response can't be empty!");

    quiz.question = question;
    quiz.answer = answer;
    await quiz.save({ fields: ["question", "answer"] });

    rl.log(`  Quiz ${id} updated to: ${question} -> ${answer}`);
}

// Delete quiz & favourites (with relation: onDelete: 'cascade')
exports.delete = async(rl) => {

    let id = await rl.questionP("Enter quiz Id");
    let n = await Quiz.destroy({ where: { id } });

    if (n === 0) throw new Error(`  ${id} not in DB`);
    rl.log(`  ${id} deleted from DB`);
}


// Funcionalidad play

sdvsv
exports.play = async(rl) => {
    let allIdQuizes = await Quiz.findAll({ attributes: ["id"], raw: true }); // Obtener TODOS los ids de quizes disponibles
    let notResolved = allIdQuizes.sort(() => Math.random() - 0.5); // Array aleatorio de Ids de quizes NO resueltos
    let countQuizesResolved = 0;
    // DEBUG let countAllQuizes = allIdQuizes.length;

    let wrong = false; // Estado de equivocación al responder ... mientras sea false seguimos jugamos
    // Jugamos mientras haya quizes disponibles o no nos equivoquemos
    while (notResolved.length > 0 && !wrong) {

        // DEBUG rl.log(`  Jugando con ${notResolved.length} quizes disponibles y ${countQuizesResolved} utilizados`);

        // Buscamos un quiz no utilizado con la condición de quiz no utilizado        
        let id = notResolved.shift().id; // Quitamos el id del quiz usado --- > OJO: con .id
        let quiz = await Quiz.findByPk(id);

        // Vemos que sale --- sólo en desarrollo
        // DEBUG /rl.log(`${quiz.id} ${quiz.question} ${quiz.answer}`);

        // Solicitamos la respuesta
        let answered = await rl.questionP(quiz.question);
        if (answered.toLowerCase().trim() === quiz.answer.toLowerCase().trim()) {
            rl.log(`  The answer "${answered}" is right!`);
            countQuizesResolved++;
        } else {
            rl.log(`  The answer "${answered}" is wrong!`);
            wrong = true; // Nos hemos equivocado ... el juego para antes de completarlo
        }
    }

    // Estadística final del juego
    rl.log(`  Score ${countQuizesResolved}`);

    // DEBUG Estadística final del juego
    // DEBUG rl.log(`  Has jugado con ${countQuizesResolved} quizes de ${countAllQuizes} disponibles`);
}

/*

// Funcionalidad play
exports.play = async(rl) => {
    let count = await Quiz.count(); // Obtener el número de quizes
    let resolved = []; // Ids de quizes resueltos
    const whereOpt = { // Condicion de un quiz no utilizado
        'id': {
            [Sequelize.Op.notIn]: resolved
        }
    };
    let wrong = false; // Estado de equivocación al responder ... mientras sea false seguimos jugamos

    // Jugamos mientras haya quizes disponibles o no nos equivoquemos
    while (resolved.length < count && !wrong) {

        rl.log(`  Jugando con ${count} quizes disponibles y ${resolved.length} utilizados`);

        // Buscamos un quiz no utilizado con la condición de quiz no utilizado
        let quiz = await Quiz.findOne({ where: whereOpt });

        // Vewmos que sale --- sólo en desarrollo
        rl.log(`${quiz.id} ${quiz.question} ${quiz.answer}`);

        // Solicitamos la respuesta
        let answered = await rl.questionP(quiz.question);
        if (answered.toLowerCase().trim() === quiz.answer.toLowerCase().trim()) {
            rl.log(`  The answer "${answered}" is right!`);
            // Anotamos el id del quiz usado
            resolved.push(quiz.id);
        } else {
            rl.log(`  The answer "${answered}" is wrong!`);
            wrong = true; // Nos hemos equivocado ... el juego para antes de completarlo
        }
    }

    // Estadística final del juego
    rl.log(`  Score ${resolved.length}`);

    // DEBUG Estadística final del juego
    rl.log(`  Has jugado con ${resolved.length} quizes de ${count} disponibles`);
}

*/