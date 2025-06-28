import React, {useState} from 'react';
import {
  View,
  Text,
  Button,
  ScrollView,
  StyleSheet,
  Alert,
  Platform,
} from 'react-native';
import XLSX from 'xlsx';
import RNFS from 'react-native-fs';
import firestore from '@react-native-firebase/firestore';
import {ProgressBar} from '@react-native-community/progress-bar-android';

interface Plat {
  code: string;
  nom: string;
  autreNom: string;
  description: string;
  origine: string;
  image?: string | null;
}

interface Ingredient {
  code: string;
  nom: string;
  autreNom: string;
  description: string;
  origine: string;
  chemin_photo_1: string;
  image?: string | null;
}

interface PlatIngredient {
  code_plat: string;
  code_ingredient: string;
  quantite: string;
  unite: string;
  commentaire: string;
}

interface ImageMeta {
  code: string;
  type: 'plat' | 'ingredient';
  path: string;
  base64?: string;
}
const UploadScreen: React.FC<{navigation: any}> = ({navigation}) => {
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);

  const log = (msg: string) => {
    setLogs(prev => [...prev, msg]);
    console.log(msg);
  };
  const copyExcelFromAssets = async () => {
    const fileName = 'repas.xlsm';
    const assetPath =
      Platform.OS === 'android'
        ? `assets/${fileName}`
        : `${RNFS.MainBundlePath}/${fileName}`;
    const destPath = `${RNFS.DocumentDirectoryPath}/${fileName}`;

    const exists = await RNFS.exists(destPath);
    if (!exists) {
      try {
        await RNFS.copyFileAssets(fileName, destPath); // <- Android uniquement
        console.log('✅ Fichier copié vers le stockage local');
      } catch (err) {
        console.log('❌ Échec copie Excel:', err);
      }
    }
  };
  const getBase64Image = async (
    relativePath: string,
  ): Promise<string | null> => {
    const possibleExtensions = ['jpg', 'jpeg', 'png', 'webp'];
    for (const ext of possibleExtensions) {
      const fullPath = `${
        RNFS.DocumentDirectoryPath
      }/IMAGE/${relativePath.replace(/\.\w+$/, `.${ext}`)}`;
      const exists = await RNFS.exists(fullPath);
      if (exists) {
        try {
          const base64 = await RNFS.readFile(fullPath, 'base64');
          return `data:image/${ext};base64,${base64}`;
        } catch (error) {
          log(`❌ Erreur lecture image : ${relativePath} (${ext})`);
          return null;
        }
      }
    }
    log(`❌ Image non trouvée pour : ${relativePath}`);
    return null;
  };

  const loadExcelData = async () => {
    //await copyExcelFromAssets();
    const filePath = `${RNFS.DocumentDirectoryPath}/repas.xlsm`;
    const exists = await RNFS.exists(filePath);

    if (!exists) {
      log('❌ Fichier Excel "repas.xlsm" non trouvé.');
      return {plats: [], ingredients: [], joins: [], images: []};
    }

    const fileContent = await RNFS.readFile(filePath, 'base64');
    const workbook = XLSX.read(fileContent, {type: 'base64'});

    const requiredSheets = ['plat', 'ingredient', 'plat_ingredient', 'photos'];
    for (const sheet of requiredSheets) {
      if (!workbook.Sheets[sheet]) {
        log(`❌ Feuille "${sheet}" non trouvée dans le fichier Excel.`);
        return {plats: [], ingredients: [], joins: [], images: []};
      }
    }

    const platsSheet = XLSX.utils.sheet_to_json(workbook.Sheets['plat']);
    const ingredientsSheet = XLSX.utils.sheet_to_json(
      workbook.Sheets['ingrdients'],
    );
    const platIngSheet = XLSX.utils.sheet_to_json(
      workbook.Sheets['plats_ingredient'],
    );
    const imagesSheet = XLSX.utils.sheet_to_json(workbook.Sheets['photos']);

    const plats: Plat[] = platsSheet.map((row: any) => ({
      code: row['code_plat'],
      nom: row['nom_plat'],
      autreNom: row['autre_nom'] || '',
      description: row['description'] || '',
      origine: row['origine'] || '',
    }));

    const ingredients: Ingredient[] = ingredientsSheet.map((row: any) => ({
      code: row['code_ingrediant'],
      nom: row['nom_ingrant'],
      autreNom: row['autre_nom'] || '',
      description: row['description'] || '',
      origine: row['origine'] || '',
      chemin_photo_1: row['chemin_photo_1'],
    }));

    const joins: PlatIngredient[] = platIngSheet.map((row: any) => ({
      code_plat: row['code_plat'],
      code_ingredient: row['code_ingrediant'],
      quantite: row['quantite'],
      unite: row['unite'],
      commentaire: row['commentaire'] || '',
    }));

    const images: ImageMeta[] = imagesSheet.map((row: any) => ({
      code: row['code'],
      type: row['type'],
      path: row['path'],
    }));

    return {plats, ingredients, joins, images};
  };
  const clearCollection = async (collectionName: string) => {
    try {
      const snapshot = await firestore().collection(collectionName).get();
      const deletions = snapshot.docs.map(doc => doc.ref.delete());
      await Promise.all(deletions);
      log(
        `🧹 Collection "${collectionName}" vidée (${snapshot.size} éléments)`,
      );
    } catch (error) {
      log(`❌ Erreur vidage collection "${collectionName}"`);
    }
  };

  const uploadData = async () => {
    setProgress(0);
    setLogs([]);
    log('📥 Début du chargement des données...');
    // 🔥 Suppression des collections avant import
    // await Promise.all([
    //   clearCollection('ingredients'),
    //   clearCollection('plats'),
    //   clearCollection('images'),
    // ]);
    await copyExcelFromAssets();
    const {plats, ingredients, joins, images} = await loadExcelData();
    const total = plats.length + ingredients.length + images.length;
    if (total === 0) {
      log('⚠️ Aucun élément à importer.');
      return;
    }

    let done = 0;

    // Upload ingrédients
    for (const ing of ingredients) {
      ing.image = await getBase64Image(`${ing.chemin_photo_1}`);
      const ingredientData = {
        code: ing.code,
        nom: ing.nom,
        autreNom: ing.autreNom,
        description: ing.description,
        origine: ing.origine,
        image: ing.image || '',
      };

      try {
        await firestore()
          .collection('ingredients')
          .doc(ing.code)
          .set(ingredientData);
        log(`✅ Ingrédient ajouté : ${ing.nom}`);
      } catch (e) {
        log(`❌ Erreur ajout ingrédient : ${ing.nom}`);
      }

      done++;
      setProgress(done / total);
    }

    // Upload plats
    for (const plat of plats) {
      const matchingJoin = joins.filter(j => j.code_plat === plat.code);
      const ingredientsDetail = await Promise.all(
        matchingJoin.map(async join => {
          const ing = ingredients.find(i => i.code === join.code_ingredient);
          return {
            code: join.code_ingredient,
            nom: ing?.nom || '',
            quantite: join.quantite,
            unite: join.unite,
            commentaire: join.commentaire,
          };
        }),
      );

      plat.image = await getBase64Image(`plats/${plat.code}`);

      const platData = {
        code: plat.code,
        nom: plat.nom,
        autreNom: plat.autreNom,
        description: plat.description,
        origine: plat.origine,
        image: plat.image || '',
        ingredients: ingredientsDetail,
      };

      try {
        await firestore().collection('plats').doc(plat.code).set(platData);
        log(`✅ Plat ajouté : ${plat.nom}`);
      } catch (e) {
        log(`❌ Erreur ajout plat : ${plat.nom}`);
      }

      done++;
      setProgress(done / total);
    }

    // Upload images
    for (const img of images) {
      const base64Image = await getBase64Image(
        `${img.type === 'plat' ? 'plats' : 'ingredients'}/${img.path}`,
      );
      const imageData = {
        code: img.code,
        type: img.type,
        path: img.path,
        base64: base64Image || '',
      };

      try {
        await firestore()
          .collection('images')
          .doc(`${img.type}_${img.code}`)
          .set(imageData);
        log(`📷 Image ajoutée pour ${img.type} ${img.code}`);
      } catch (e) {
        log(`❌ Erreur ajout image ${img.code}`);
      }

      done++;
      setProgress(done / total);
    }

    log('✅ Importation terminée.');
  };

  function alert(message: string) {
    Alert.alert('Information', message);
  }

  return (
    <View style={styles.container}>
      <View style={{marginBottom: 20}}>
        <Button
          title="Tester chargement fichier"
          onPress={async () => {
            const filePath = `${RNFS.DocumentDirectoryPath}/repas.xlsm`;
            const exists = await RNFS.exists(filePath);
            alert(exists ? 'Fichier trouvé ✅' : 'Fichier manquant ❌');
          }}
        />
      </View>
      <Button
        title="Tester accès Excel"
        onPress={async () => {
          try {
            await copyExcelFromAssets();
            const filePath = `${RNFS.DocumentDirectoryPath}/repas.xlsm`;
            const exists = await RNFS.exists(filePath);
            alert(
              exists ? '✅ Fichier prêt à être lu' : '❌ Toujours pas trouvé',
            );
          } catch (e) {
            alert('Erreur : ' + (e instanceof Error ? e.message : String(e)));
          }
        }}
      />

      <Button title="Uploader les Données" onPress={uploadData} />
      <ProgressBar
        styleAttr="Horizontal"
        progress={progress}
        indeterminate={false}
        style={{marginTop: 10}}
      />
      <ScrollView style={{marginTop: 20}}>
        {logs.map((log, index) => (
          <Text
            key={index}
            style={{
              color: log.startsWith('❌') ? 'red' : 'black',
              marginBottom: 5,
            }}>
            {log}
          </Text>
        ))}
      </ScrollView>
    </View>
  );
};

export default UploadScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    marginTop: 40,
    backgroundColor: '#fff',
  },
});
