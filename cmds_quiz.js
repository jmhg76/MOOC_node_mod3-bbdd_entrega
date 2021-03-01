const { User, Quiz, Score } = require("./model.js").models;

// Para poder especificar filtros
//const { Sequelize } = require('sequelize');

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
exports.play = async(rl) => {
    let allIdQuizes = await Quiz.findAll({ attributes: ["id"], raw: true }); // Obtener TODOS los ids de quizes disponibles, en forma de array de pares {id: n}
    let notResolved = allIdQuizes.map(e => e.id).sort(() => Math.random() - 0.5); // Array aleatorio de Ids de quizes NO resueltos
    let countQuizesResolved = 0;
    // DEBUG let countAllQuizes = allIdQuizes.length;

    let wrong = false; // Estado de equivocación al responder ... mientras sea false seguimos jugamos
    // Jugamos mientras haya quizes disponibles o no nos equivoquemos
    while (notResolved.length > 0 && !wrong) {

        // DEBUG rl.log(`  Jugando con ${notResolved.length} quizes disponibles y ${countQuizesResolved} utilizados`);

        // Buscamos un quiz no utilizado con la condición de quiz no utilizado        
        let id = notResolved.shift(); // Quitamos el id del quiz usado
        let quiz = await Quiz.findByPk(id);

        // Vemos que sale --- sólo en desarrollo
        // DEBUG rl.log(`${quiz.id} ${quiz.question} ${quiz.answer}`);

        // Mostramos la pregunta seleccionada y solicitamos la respuesta
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
    rl.log(`  Score: ${countQuizesResolved}`);


    // DEBUG Estadística final del juego
    // DEBUG rl.log(`  Has jugado con ${countQuizesResolved} quizes de ${countAllQuizes} disponibles`);

    /*
     Ampliar la funcionalidad play para solicitar el nombre de usuario (usando la función rl.questionP)
     al finalizar el juego y para almacenar la puntuación asociada a dicho usuario en la tabla Scores 
     de la base de datos. En caso de que el usuario introducido no exista se creará un nuevo usuario 
     con el nombre introducido y edad 0.
    */
    let name = await rl.questionP("Enter name"); // Solicitamos nombre de jugador
    let user = await User.findOne({
        where: { name }
    });

    if (!user) { // El usuario no existe, lo creamos junto con su puntuación
        user = await User.create({
            name: name,
            age: 0,
            scores: [{ wins: countQuizesResolved }]
        }, {
            include: [{ // Include que corresponde a la relación 1-N entre User y Score => For Each ... user.scores.forEach
                model: Score,
                as: 'scores'
            }]
        });
    } else { // El usuario sí existe, sólo creamos junto con su puntuación
        await Score.create({
            wins: countQuizesResolved,
            userId: user.id // id de User recuperado en la consulta del nombre de jugador inicial
        });
    }

    /*
         // DEBUG - Esto es sólo para comprobarlo
        user = await User.findOne({
            where: { name },
            include: [{ // Include que corresponde a la relación 1-N entre User y Score => For Each ... user.scores.forEach
                model: Score,
                as: 'scores',
                include: [{ model: User, as: 'player' }] // Include que corresponde a la relación N-1 entre Score y User => Sólo un valor dentro de un score del forEach
            }]
        });
        // DEBUG - Esto es sólo para comprobarlo
        rl.log(`  User: ${user.name} `);
        user.scores.forEach(
            (score => rl.log(`  Score: ${score.id} Wins: ${score.wins} Player: ${score.player.name}`))
        ); 
    */


}

// Funcionalidad Score
/*
4. Implementar la funcionalidad del nuevo comando ls (list score) que pinta una lista 
   (cada línea debe pintarse con la función rl.log) de las puntaciones almacenadas en 
   la base de datos ordenadas de mayor a menor con el siguiente formato (para dar formato 
    a la fecha se debe utilizar el método toUTCString() del objeto Date): 
*/
exports.score = async(rl) => {
    let scores = await Score.findAll({
        include: [{ model: User, as: 'player' }],
        order: [
            ['wins', 'DESC'], // Orden solicitado
            [{ model: User, as: 'player' }, 'name', 'ASC'] // Orden incluido para ver como funciona
        ]
    });
    scores.forEach(
        (score => rl.log(`${score.player.name}|${score.wins}|${new Date(score.createdAt).toUTCString()}`))
    );
}