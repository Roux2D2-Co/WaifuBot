import { UserModel } from "./models/user";
import { init } from "./databaseConnection";

/**
 * Init est une Promise (aka promesse)
 * Le principe c'est que c'est une fonction asynchrone, on sait pas combien de temps elle va mettre
 * à s'exécuter et on lui fait confiance car elle nous fait la promesse de nous tenir au courant de son état
 *
 * Les sorties possibles sont au nombre de 2 :
 *
 *   - La résolution, tout se passe bien et on continue soit dans un .then() comme ci-dessous soit après un await
 *   - Le rejet, la fonction a rompu sa promesse (comme mon ex cette salope) et on continue dans un .catch(),
 *      si on mets pas de .catch cela throw une erreur automatiquement
 */
init().then(() => {
	/**
	 * Pour interagir avec la base de données MongoDb on utilise des Schemas et des Models
	 * Le Schema représente la structure de notre objet, c'est à dire les champs qu'il contient
	 * Le Model est une instance de Schema, c'est à dire qu'il contient les méthodes pour interagir avec la base de données
	 *
	 * Pour récupérer un Document (en gros un truc dans la bdd) on fait appel au model du document
	 *  qu'on veut récupérer (ici un User) et on appelle la méthode findOne.
	 *
	 * La méthode findOne se base sur le Schema pour permettre de filtrer les documents en fonction des valeurs qu'ils contiennent
	 */

	const Le_Roux_Nard = UserModel.findOne({ id: "396233379890200579" }); // salut c'est moi

	// $lt = inférieur à
	// Ici on cherche donc tout les profils (avec find et pas findOne) qui ont une "deleteDate" inférieure à la Date actuelle
	const ProfilsQuiDoiventEtreSupprimés = UserModel.find({ deleteDate: { $lt: new Date() } });

	/**
	 * Pour créer un nouveau document on fait appel au model du document qu'on veut créer
	 * On peut soit appeler la méthode create sur le model ou utiliser le model comme un constructeur et
	 * utiliser la méthode .save sur le document créé
	 *
	 * La méthode create insère direct en base de données alors que le new Model() permet d'avoir une instance
	 * uniquement locale en cas de besoin
	 */

	const NouveauProfil = UserModel.create({
		id: "123456789",
		quote: "Je suis un nouveau profil",
	});

	const NouveauProfilAlternatif = new UserModel({
		id: "123456789",
		quote: "Je suis un nouveau profil",
	});
	NouveauProfilAlternatif.save();

	/**
	 * Pour modifier un document on fait appel au model du document qu'on veut modifier
	 * et on appelle la méthode findOneAndUpdate
	 */

	UserModel.findOneAndUpdate(
    { id: "123456789" },                              // On cherche le profil avec l'id 123456789
    { quote: "Je suis un profil modifié" }            // On ne modifie que la valeur de "quote" 
  );                                                  //  et on laisse le reste tranquille
});
