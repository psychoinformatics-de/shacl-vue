<template>
    <v-divider></v-divider>
    <v-container fluid>
        <div id="example-table"></div>
    </v-container>
        

</template>

<script setup>

    import { ref, onMounted} from 'vue';

    import {TabulatorFull as Tabulator} from 'tabulator-tables'; //import Tabulator library


    const tabulator = ref(null); //variable to hold your table
    const tableData = ref([
        {id:1, name:"Billy Bob", age:"12", gender:"male", height:1, col:"red", dob:"", cheese:1},
        {id:2, name:"Mary May", age:"1", gender:"female", height:2, col:"blue", dob:"14/05/1982", cheese:true}
    ]); //data for table to display

    

    onMounted(() => {
        var table = new Tabulator("#example-table", {
                height:205, // set height of table (in CSS or here), this enables the Virtual DOM and improves render speed dramatically (can be any valid css height value)
                data:tableData.value, //assign data to table
                layout:"fitColumns",
                columns:[
                    {title:"Name", field:"name"},
                    {title:"Age", field:"age"},
                    {title:"Gender", field:"gender"},
                    {title:"Height", field:"height"},
                    {title:"Favourite Color", field:"col"},
                    {title:"Date Of Birth", field:"dob"},
                    {title:"Cheese Preference", field:"cheese"},
                ]
            });

    });


</script>

<style lang="scss">
    @import  "/node_modules/tabulator-tables/dist/css/tabulator_materialize.min.css";
</style>