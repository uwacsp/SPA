require([
        "splunkjs/mvc",
        "jquery",
        "splunkjs/mvc/tableview",
        "splunkjs/mvc/simpleform/input/text",
        "splunkjs/mvc/simpleform/input/dropdown",
        "splunkjs/mvc/simpleform/input/submit",
        "splunkjs/mvc/searchmanager",
        "splunkjs/mvc/simplexml/ready!"
    ],
    function(
        mvc,
        $,
        TableView,
        TextInput,
        DropdownInput,
        SubmitButton,
        SearchManager
    ) {

        //
        // VIEWS: FORM INPUTS
        //
        var ipAddress = new TextInput({
            "id": "ipAddress",
            "value": mvc.tokenSafe("$ipAddress$"),
            "el": $('#ipAddress')
        }, { tokens: true }).render();

        var host = new TextInput({
            "id": "host",
            "value": mvc.tokenSafe("$host$"),
            "el": $('#host')
        }, { tokens: true }).render();

        var severity = new DropdownInput({
            "id": "severity",
            "choices": [
                { "value": "1", "label": "1" },
                { "value": "2", "label": "2" },
                { "value": "3", "label": "3" },
                { "value": "4", "label": "4" },
                { "value": "5", "label": "5" }
            ],
            "default": "1",
            "value": mvc.tokenSafe("$severity$"),
            "el": $('#severity')
        }, { tokens: true }).render();

        //
        // SEARCH MANAGERS
        //

        var searchBlacklist = new SearchManager({
            "id": "searchBlacklist",
            "search": " | inputlookup myblacklist_lookup | eval  IpAddress = _key | table IpAddress, Host, Severity",
            "preview": true
        }, { tokens: true });

        var addCsvBlacklist = new SearchManager({
            "id": "addCsvBlacklist",
            "autostart": "false",
            "search": `source="*blacklists*"
                        | dedup ip_address
                        | rename extracted_host as Host, severity as Severity
                        | table ip_address, Host, Severity
                        | outputlookup myblacklist_lookup append=T key_field=ip_address`
        });


        //
        // DISPLAY TABLE
        //

        var element1 = new TableView({
            "id": "element1",
            "drilldown": "none",
            "managerid": "searchBlacklist",
            "el": $('#display')
        }, { tokens: true }).render();

        //
        // SERVICE OBJECT
        //

        // Create a service object using the Splunk SDK for JavaScript
        // to send REST requests
        var service = mvc.createService({ owner: "nobody" });

        //
        // SUBMIT FORM DATA
        //

        var submit = new SubmitButton({
            id: 'submit',
            el: $('#submit_btn')
        }, { tokens: true }).render();

        submit.on("submit", function() {
            // When the Submit button is clicked, get all the form fields by accessing token values
            var tokens = mvc.Components.get("default");
            var form_ip = tokens.get("ipAddress");
            var form_host = tokens.get("host");
            var form_sev = tokens.get("severity");

            // Create a dictionary to store the field names and values
            var record = {
                "_key": form_ip,
                "Host": form_host,
                "Severity": form_sev
            };

            // Use the request method to send a REST POST request
            // to the storage/collections/data/{collection}/ endpoint
            service.request(
                    "storage/collections/data/myblacklist/",
                    "POST",
                    null,
                    null,
                    JSON.stringify(record), {
                        "Content-Type": "application/json"
                    },
                    null)
                .done(function() {
                    // Run the search again to update the table
                    searchBlacklist.startSearch();

                    // Clear the form fields
                    $("#formBlacklist input[type=text]").val("");
                    tokens.set("ipAddress", "");
                    tokens.set("host", "");
                });
        });

        $(".addCsvButton").on("click", function() {
            var ok = confirm("Add data from CSV folder?");
            if (ok) {
                addCsvBlacklist.startSearch();
                alert('Data added!');
                searchBlacklist.startSearch();
            }
        });

    });
