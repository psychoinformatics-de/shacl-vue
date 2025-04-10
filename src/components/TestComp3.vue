<template>
    <v-divider></v-divider>
    <v-container fluid>
        <v-btn id="file-load-trigger" @click="chooseFile()">Choose File</v-btn>
        <v-btn @click="logData()">Log data</v-btn>
        <div id="something"></div>
    </v-container>
        

</template>

<script setup>

    import { ref, onMounted} from 'vue';
    import rdf from 'rdf-ext'

    import { RdfDataset } from "shacl-tulip";
    import {TabulatorFull as Tabulator} from 'tabulator-tables'; //import Tabulator library
    import Papa from 'papaparse';

    // import CsvwParser from 'rdf-parser-csvw';
    
    const basePath = import.meta.env.BASE_URL || '/';
    const metadataFile = `${basePath}csv-metadata.jsonld`;
    // const metadataFile = `${basePath}csv-metadata.json`;
    const csvFile = `${basePath}csvdata.csv`;

    const tabulator = ref(null); //variable to hold your table
    const tableData = ref([
        {id:1, name:"Billy Bob", age:"12", gender:"male", height:1, col:"red", dob:"", cheese:1},
        {id:2, name:"Mary May", age:"1", gender:"female", height:2, col:"blue", dob:"14/05/1982", cheese:true}
    ]); //data for table to display

    var table


    onMounted(async () => {

        const kaas = Papa.parse(csvFile, {
            download: true,
            // step: function(results, parser) {
            //     console.log("Row data:", results.data);
            //     console.log("Row errors:", results.errors);
            // },
            complete: function(results, file) {
                console.log("Parsing complete:", results, file);
                console.log(results.data)
            }
        })

        // var table = new Tabulator("#something", {
        //     height:205, // set height of table (in CSS or here), this enables the Virtual DOM and improves render speed dramatically (can be any valid css height value)
        //     data: tableData.value, //assign data to table
        //     layout:"fitColumns",
        //     columns:[
        //         {title:"Name", field:"name"},
        //         {title:"Age", field:"age"},
        //         {title:"Gender", field:"gender"},
        //         {title:"Height", field:"height"},
        //         {title:"Favourite Color", field:"col"},
        //         {title:"Date Of Birth", field:"dob"},
        //         {title:"Cheese Preference", field:"cheese"},
        //     ]
        // });

        table = new Tabulator("#something", {
            height:205, // set height of table (in CSS or here), this enables the Virtual DOM and improves render speed dramatically (can be any valid css height value)
            layout:"fitColumns",
            autoColumns: true
        });

        

            

        // const metaDS = new RdfDataset();
        // // metaDS.loadRDF(metadataFile)
        // const metadata = await rdf.io.dataset.fromURL(metadataFile)

        // metadata.forEach((quad) => {
        //     console.log(`${quad.subject.value} - ${quad.predicate.value} -  ${quad.object.value}`)
        // });

        // const parser = new CsvwParser({
        //     factory: rdf,
        //     baseIRI: 'csv-metadata.jsonld',
        //     metadata,
        //     timezone: 'UTC'
        // })
        // const input = createReadStream(csvFile)
        // const stream = parser.import(input)

        // const myDS = rdf.dataset()
        // const actual = await myDS.import(stream)

        // myDS.forEach((quad) => {
        //     console.log(`${quad.subject.value} - ${quad.predicate.value} -  ${quad.object.value}`)
        // });

    });

    function chooseFile() {
        table.import("csv", csvFile)

    }

    function logData() {
        console.log(table.getData())
    }

    


</script>

<style scoped>
    #something {
        margin: 1em 1em;
    }
</style>

<style lang="scss">
    @import  "/node_modules/tabulator-tables/dist/css/tabulator_materialize.min.css";
</style>