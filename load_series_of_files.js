import { readTextFile } from '../js_xhr_ajax/xhr_ajax.js';


export let fileData = [];


export function loadSeriesOfFiles(startingFilePath, callback) {
    readTextFile(
        {
            url: startingFilePath
        },
        rawFileContent => {
            const obj = JSON.parse(rawFileContent);
            const fileDirectory = startingFilePath.match(/.*\//)[0];
            let addToFileData = null;

            if (obj.list_of_features)
                addToFileData = {
                    file: startingFilePath,
                    list_of_features: obj.list_of_features,
                    subfiles: null
                };
            if (obj.load_json_files)
                obj.load_json_files.forEach(nextFilePath => {
                    const nextFilePathFull = fileDirectory + nextFilePath;

                    if (addToFileData !== null) {
                        if (addToFileData.subfiles === null)
                            addToFileData.subfiles = [];
                        addToFileData.subfiles.push(nextFilePathFull);
                    }

                    loadSeriesOfFiles(nextFilePathFull);
                });

            if (addToFileData !== null)
                fileData.push(addToFileData);
            if (callback)
                callback();
        }
    );
}


export function checkIfFilesAreLoaded(callback) {
    let listOfFileNames = [];
    let testPassed = false;

    function addToList(path) {
        if (listOfFileNames.filter(a => a === path).length === 0)
            listOfFileNames.push(path);
    }
    function testFailed() {
        const fileCount = listOfFileNames.length;
        console.error('⚠️ Test failed');
        console.error(`%d files detected so far. Retrying in 2 seconds...`, fileCount);
        setTimeout(() => { checkIfFilesAreLoaded(callback) }, 2000);
    }
    function testComplete() {
        const fileCount = listOfFileNames.length;
        console.info('✅ Test complete');
        console.info(`%d files were detected`, fileCount);
        callback();
    }

    // Step 0

    if (fileData.length === 0) {
        testFailed();
        return;
    }

    // Step 1

    fileData.forEach(obj => {
        addToList(obj.file);
        if (obj.subfiles !== null)
            obj.subfiles.forEach(subfilePath => {
                addToList(subfilePath);
            });
    });

    // Step 2

    testPassed = listOfFileNames.every(file => {
        const filteredObject = fileData.filter(a => a.file === file);
        if (filteredObject.length === 0)
            return false;
        else if (filteredObject.length === 1 && filteredObject[0].list_of_features.length > 0)
            return true;
        else {
            console.error('Something is wrong: ambiguous files found.');
            return false;
        }
    });

    // Step 3

    if (testPassed === true)
        testComplete();
    else if (testPassed === false)
        testFailed();
}