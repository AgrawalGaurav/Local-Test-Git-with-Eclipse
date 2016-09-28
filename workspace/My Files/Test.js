/******************************************************************************

Function Name: dunningletter
Author: Gaurav 
Description: The purpose of this script design is to send email to collector
and user for all the open Invoice, Credit Memo, Customer Payment using scheduler every 15th of month
Version : 1.2
testing

*******************************************************************************/
var UDID_DET = {
    'udid 1': 'custbody_udidv1',
    'udid 2': 'custbody_udidv2',
    'udid 3': 'custbody_udidv3',
    'udid 4': 'custbody_udidv4',
    'udid 5': 'custbody_udidv5',
    'udid 6': 'custbody_udidv6',
    'udid 7': 'custbody_udidv7',
    'udid 8': 'custbody_udidv8',

    'udid sort 1': 'custbody_sort1',
    'udid sort 2': 'custbody_sort2',
    'udid sort 3': 'custbody_sort3',
    'udid sort 4': 'custbody_sort4',
    'udid sort 5': 'custbody_sort5',
    'udid sort 6': 'custbody_sort6',
    'udid sort 7': 'custbody_sort7',
    'udid sort 8': 'custbody_sort8',
    'udid sort 9': 'custbody_sort9',

    'udid gov 1': 'custbody_gov1',
    'udid gov 2': 'custbody_gov2',
    'udid gov 3': 'custbody_gov3',
    'udid gov 4': 'custbody_gov4',
    'udid gov 6': 'custbody_gov6',
    'udid gov 5': 'custbody_gov5',
    'udid gov 7': 'custbody_gov7',
    'udid gov 8': 'custbody_gov8',
    'udid gov 9': 'custbody_gov9'
};

var context = nlapiGetContext();

function ScheduledDunningLetter() 
{
    try {
		 var totalResults = GetAllResults('transaction', 'customsearch_francedunninglettercustome');
		 
		nlapiLogExecution('DEBUG','SEARCH LENGTH',totalResults.length);
        var resultsIn = [];
		var temp = '';
        if (totalResults && totalResults.length > 0) {
            for (var i = 0; i < totalResults.length; i++) {
                var result = totalResults[i], allfields = result.getAllColumns(), customernamecolumn = result.getValue(allfields[0]);
                if (i == 0) {
                    resultsIn.push(customernamecolumn);
                } else {
                    if (customernamecolumn != temp)
                        resultsIn.push(customernamecolumn);
                }
                temp = customernamecolumn;
                //if (i == totalResults.length - 1) finalArr.push(resultsIn);
            }
        }

		var customerwithoutcollector = [];
        for (k = 0; k < resultsIn.length ; k++) 
		{
            var customerid = resultsIn[k];

            var filterx = new Array();
			filterx[0] = new nlobjSearchFilter('internalid',null,'is', customerid);
			var search = nlapiSearchRecord('job',null,filterx);
			if((search) && (search.length == 1))
			{
				//type = 'job';
				var prjrrecord = nlapiLoadRecord('job', customerid);
				customerid = prjrrecord.getFieldValue('parent');
			}

            var customerrecord = nlapiLoadRecord('customer', customerid);
            var customername = customerrecord.getFieldValue('companyname');
            nlapiLogExecution('DEBUG', '1A:customername', customername);
            nlapiLogExecution('DEBUG', '1B:customerid', customerid);

            if (customerrecord) 
			{
                var collectorid = customerrecord.getFieldValue('custentity_gbt_collector');
				
				if( collectorid)
				{
                var collectorname = customerrecord.getFieldText('custentity_gbt_collector');
                var custid = customerrecord.getFieldValue('entityid');

                var objDatas = {
                    CUSTOMER_newaddr1: '',
                    CUSTOMER_newaddr2: '',
                    CUSTOMER_newaddr3: '',
                    CUSTOMER_newcity: '',
                    CUSTOMER_newstate: '',
                    CUSTOMER_newzip: '',
                    CUSTOMER_country: ''

                };
                // fetch address 
                var addresscount = customerrecord.getLineItemCount('addressbook');
                for (var j = 1; j <= addresscount; j++) {
                    var defaultshipping = customerrecord.getLineItemValue('addressbook', 'defaultshipping', j);
                    var defaultbilling = customerrecord.getLineItemValue('addressbook', 'defaultbilling', j);
                    if ((defaultshipping == 'T')) {
                        var newaddr1 = customerrecord.getLineItemValue('addressbook', 'addr1', j);
                        var newaddr2 = customerrecord.getLineItemValue('addressbook', 'addr2', j);
                        var newaddr3 = customerrecord.getLineItemValue('addressbook', 'addr3', j);
                        var newcity = customerrecord.getLineItemValue('addressbook', 'city', j);
                        var newstate = customerrecord.getLineItemValue('addressbook', 'state', j);
                        var newzip = customerrecord.getLineItemValue('addressbook', 'zip', j);
                        var newcountry = customerrecord.getLineItemValue('addressbook', 'country', j);


                        objDatas = {
                            CUSTOMER_newaddr1: newaddr1,
                            CUSTOMER_newaddr2: newaddr2,
                            CUSTOMER_newaddr3: newaddr3,
                            CUSTOMER_newcity: newcity,
                            CUSTOMER_newstate: newstate,
                            CUSTOMER_newzip: newzip,
                            CUSTOMER_country: newcountry
                        };
                    }
                }
                var objData = {
                    COLLECTOR_EMAIL: '',
                    COLLECTOR_PHONE: '',
                    COLLECTOR_NAME: '',
                    CUSTOMER_NUMBER: customerrecord.getFieldValue('entityid'),
                    COLLECTOR_FAX: ''
                };
                var collectorrecord = '', collectoremail = '', collectorphone = '', collectorfax = '';

                    collectorrecord = nlapiLoadRecord('employee', collectorid);
                    collectoremail = collectorrecord.getFieldValue('email');
					collectorphone = collectorrecord.getFieldValue('phone');
					collectorfax = collectorrecord.getFieldValue('fax');
					
                    objData = {
                        COLLECTOR_EMAIL: collectorrecord.getFieldValue('email'),
                        COLLECTOR_PHONE: collectorrecord.getFieldValue('phone'),
                        COLLECTOR_NAME: customerrecord.getFieldText('custentity_gbt_collector'),
                        CUSTOMER_NUMBER: customerrecord.getFieldValue('entityid'),
                        COLLECTOR_FAX: collectorrecord.getFieldValue('fax')
                    };
             
				var totalResults1 = GetAllResults('transaction', 'customsearch_france_dunningletter_2',customerid);
                var allResults = totalResults1.filter(function (item) { return item.getValue('name', null,'GROUP') == customerid });
				checkMetering();
                if (allResults && ((allResults.length) != null) && ((allResults.length) != '') && ((allResults.length) != 0)) {
                    var middleTableData = '';
                    var dividearray = DivideArrayLength(allResults.length)
                    try {
                        var stat1 = customerrecord.getFieldText('custentity_fr_stat1'), stat2 = customerrecord.getFieldText('custentity_fr_stat2');

                        var str = Template3Detailed(objData, customername, objDatas, 0);
                        middleTableData = MiddleTable(allResults, customername, objData, objDatas, stat1, stat2);
                        var middleTable = middleTableData.str;
                        var xml = '<?xml version=\"1.0\"?>\n<!DOCTYPE pdf PUBLIC \"-//big.faceless.org//report\" \"report-1.1.dtd\">';
                        xml += '<pdf>';
                        xml += '<head>' + AddMacroFooter(customername, DivideArrayLength(allResults.length), allResults) + '</head>';

					    xml += '<body font-size="8" font-family="monospace" body-size ="A4" footer="nlfooter0" footer-height="1.2in">'; 
                        xml += str + middleTable;
                        xml += '</body>';
                        xml += '</pdf>';

                        var file = nlapiXMLToPDF(xml);
                        file.setName(collectorname + '_' + GetTime().YYYYMMDD + '_' + customername + '_' + customerid + '_' + 'Relances.pdf');
                        file.setFolder(30772);
                        nlapiSubmitFile(file);
                        nlapiLogExecution('DEBUG', '3A', 'Dunning Letter Detailed');
                    } catch (exxx) {
                        nlapiLogExecution('DEBUG', 'Error while creating PDF', exxx);
                    }
          
                }
            }
			
			else
			{
				// generate a csv for customers w/o collectors
				customerwithoutcollector.push({'NAME' : customername, 'ID': customerid});
				
			}
    } 
	}
	nlapiLogExecution('DEBUG',JSON.stringify(customerwithoutcollector));
	 if(customerwithoutcollector && customerwithoutcollector.length > 0)
	{
		var id = CreateCSVFile(customerwithoutcollector);
	}
}
		catch (ex) {
				nlapiLogExecution('DEBUG', 'ERROR in ScheduledDunningLetter():', ex);
			}
}

function CreateCSVFile(customerwithoutcollector) 
	{
		var value = 'Sr.No,CustomerName,CustomerId \n'
		for (var customercount = 0; customercount < customerwithoutcollector.length; customercount++)
		{
			value += (customercount + 1) + ',' + customerwithoutcollector[customercount].NAME.toString() + ',' + customerwithoutcollector[customercount].ID.toString() + '\n' ;
		}
		var csvfile = nlapiCreateFile('CustomersWithoutCollectors' + GetTime().YYYYMMDD + '.csv', 'CSV', value);
		csvfile.setFolder(30772);
		var fileids = nlapiSubmitFile(csvfile);
	}

function AddMacroFooter(customername, arralllength, allResults) {
    try {
        var sumOfPreviousPage = 0, sumOfDontLitige = 0, arrSPP = [], arrSDL = [];
        var footer = '<macrolist>';
        var cols = allResults[0].getAllColumns();
        var len = arralllength.length;

        for (var countLoopLength = 0; countLoopLength < arralllength.length; countLoopLength++) {

            var from = 0, to = 0;

            if (countLoopLength == 0) {
                from = 0, to = parseFloat(arralllength[countLoopLength]);
            } else {
                for (var i = 0; i < countLoopLength; i++) {
                    from += parseFloat(arralllength[i]);
                }
                for (var j = 0; j <= countLoopLength; j++) {
                    to += parseFloat(arralllength[j]);
                }
            }

            for (var countRes = from; countRes < to; countRes++) {
		
				sumOfPreviousPage += parseFloat(allResults[countRes].getValue(cols[8]));
                sumOfDontLitige += (allResults[countRes].getValue(cols[9]) == 'T' ? parseFloat(allResults[countRes].getValue(cols[8])) : 0);
            }
            arrSDL.push(sumOfDontLitige);
            arrSPP.push(sumOfPreviousPage);
            //footer += '<macro id="nlfooter' + countLoopLength + ' ">' + DetailedFooter(customername, sumOfPreviousPage, sumOfDontLitige) + ' </macro>'
        }

        for (var countLoop = 0; countLoop < arralllength.length; countLoop++) {
            if (countLoop == len - 1) {
                footer += '<macro id="nlfooter' + countLoop + ' ">' + DetailedFooter(customername, arrSPP[countLoop], arrSDL[countLoop], arrSPP[arralllength.length - 1], true) + ' </macro>'
            } else {
                footer += '<macro id="nlfooter' + countLoop + ' ">' + DetailedFooter(customername, arrSPP[countLoop], arrSDL[countLoop], arrSPP[arralllength.length - 1], false) + ' </macro>'
            }
        }

        footer += '</macrolist>';

        return footer;
    }
    catch (ex) {
        nlapiLogExecution('DEBUG', 'ERROR in AddMacroFooter():', ex);
    }
    return '';
}

function GetAllResults(recType, searchId, customerid) {
    var result = nlapiLoadSearch(recType, searchId);
    var filterss = new Array();
    var columnss = new Array();
    if (customerid) {
        filterss[0] = new nlobjSearchFilter('name', null, 'anyof', customerid);
		result.addFilters(filterss);
    }
    var searchRS = result.runSearch();
    var results = [];
    var tempResults = [];
    var tempResultsLength = 0;

    do {
        var resultsLength = results.length;
		checkMetering();
        tempResults = searchRS.getResults(resultsLength, resultsLength + 1000) || [];
        tempResultsLength = tempResults.length;
        if (tempResults != null && tempResultsLength > 0) {
            results = results.concat(tempResults);
        }
    } while (tempResultsLength == 1000);
    return results;
}

/******** Show a error message instead of showing blank page*********/

function failForm(errmsg) {
    var form = nlapiCreateForm("Dunning Letter Form");
    var success = form.addField('error', 'text', errmsg, null);
    success.setDisplayType('inline');
    response.writePage(form);
}

/***** End *****/

/******** After Form Submit Page*********/

function successForm() {
    var form = nlapiCreateForm("Dunning Letter Confirmation");
    var success = form.addField('emailsuccess', 'text', 'Email Sent to Collector and User', null);
    success.setDisplayType('inline');
    response.writePage(form);
    /*window.open('https://system.sandbox.netsuite.com/app/site/hosting/scriptlet.nl?script=1124&deploy=1', '_self'); }*/
}

function nonEmailForm() {
    var form = nlapiCreateForm("Dunning Letter Confirmation");
    var success = form.addField('emailerror', 'text', 'Selected Customer has no Open Transactions to send email', null);
    success.setDisplayType('inline');
    response.writePage(form);
   }

/***** End *****/

function Template1(objData, sum) {
    var str = '';
    str += '<table width="100%">';
	str += '<tr>';
	str += '<td>';
    str += '<img src="' + nlapiEscapeXML("https://system.na1.netsuite.com/core/media/media.nl?id=2135433&c=3299334&h=50e03b53b9f9edb5343d&whence=") + '" width ="55%" height = "25px"/>';

	str += '</td>';
	str += '</tr>';
	str += '</table>';
	
    str += '<table cellpadding="0" cellspacing="0" width="100%">';
    str += '<tr>';
    str += '<td>';
	str += '<table width="100%"><tr>';
	str += '<td width="60%">&nbsp;</td>';
	str += '<td>';
    str += '<p style="margin-left:30;">AMERICAN EXPRESS VOYAGES ' + nlapiEscapeXML("D'AFFAIRES") +
    '<br/>18, Rue des Deux Gares <br/>Green Office Bâtiment Ouest<br/>92500 Rueil Malmaison<br/>' +
    (objData.COLLECTOR_NAME ? nlapiEscapeXML(objData.COLLECTOR_NAME) : '') + '<br/>' +
    (objData.COLLECTOR_EMAIL ? nlapiEscapeXML(objData.COLLECTOR_EMAIL) : '') + '<br/>' +
    (objData.COLLECTOR_PHONE ? nlapiEscapeXML(objData.COLLECTOR_PHONE) : '') + '<br/>' +
    '</p></td>';
    str += '</tr></table>';
    str += '</td></tr>';

    str += '<tr style="margin-top:30px;"><td align="left"><p>';
    str += 'Objet : Relance <br/>';
    str += 'Nos réf :' + (objData.CUSTOMER_NUMBER ? nlapiEscapeXML(objData.CUSTOMER_NUMBER) : '') + '<br/>';
    str += 'PJ Détail des impayés';
    str += '</p></td>';
    str += '</tr>';

    str += '<tr style="margin-top:40px;">';
    str += '<td align="left">';
    str += '<p> Mr/Mme, <br/></p>';
    str += '</td>';
    str += '</tr>';

    str += '<tr style="margin-top:60px;">';
    str += '<td align="left"><p>';
    str += 'Sauf erreur de notre part, votre situation dans nos livres fait apparaître que <br/>';
    str += 'vous restez redevable de la somme de ' + parseFloat(sum).toFixed(2).toString().replace('.', '.') + ' €. <br/>';
    str += '<br/>';
    str += 'Etant donné l’ancienneté de ces opérations dont vous trouverez le détail <br/>';
    str += 'ci-joint, nous vous prions de nous régler ladite somme sous huitaine ou de nous <br/>';
    str += 'faire connaître les motifs de votre désaccord. <br/>';
    str += '<br/>';
    str += 'Restant à votre dispositions pour tout renseignement complémentaire, nous <br/>';
    str += 'vous prions d’agréer,Mr/Mme , l’expression de nos salutations <br/>';
    str += 'distinguées.';
    str += '</p></td>';
    str += '</tr>';

    str += '<tr style="margin-left:60%;margin-top:50px;">';
    str += '<td><p style="margin-left:60%;">';
    str += 'Service Recouvrement <br/>';
    str += (objData.COLLECTOR_NAME ? nlapiEscapeXML(objData.COLLECTOR_NAME) : '') + '<br/>';
    str += 'Tel' + (objData.COLLECTOR_PHONE ? nlapiEscapeXML(objData.COLLECTOR_PHONE) : '') + '<br/>';
    str += 'Email :' + (objData.COLLECTOR_EMAIL ? nlapiEscapeXML(objData.COLLECTOR_EMAIL) : '') + '<br/>';
    str += 'AMERICAN EXPRESS VOYAGES ' + nlapiEscapeXML("D'AFFAIRES") + '<br/>18, Rue des Deux Gares <br/>Green Office Bâtiment Ouest<br/>92500 Rueil Malmaison';
	str += '</p></td>';
    str += '</tr>';
    str += '</table>';
    return str;
}

function Template3Detailed(objData, customername, objDatas, line) {
    var str = Header(objData, customername, objDatas, line);
    return str;
}

function Header(objData, customername, objDatas, line) {
	checkMetering();
    var str = '';
	str += '<table width="100%">';
	str += '<tr>';
	str += '<td>';
    str += '<img src="' + nlapiEscapeXML("https://system.na1.netsuite.com/core/media/media.nl?id=2135433&c=3299334&h=50e03b53b9f9edb5343d&whence=") + '" width ="55%" height = "25px"/>';

	str += '</td>';
	str += '</tr>';
	str += '</table>';
	
    str += '<table width="100%" border="0">';

    str += '<tr>';
	
    str += '<td width="70%" >';
	
	str += '<table><tr>';
	str += '<td></td>';
	str += '<td align="right" style="margin-right:5px;margin-left:10px;">';
	
    str += '<p margin-left = "320px">AMERICAN EXPRESS VOYAGES ' + nlapiEscapeXML("D'AFFAIRES") +
    '<br/>18, Rue des Deux Gares <br/>Green Office Bâtiment Ouest<br/>92500 Rueil Malmaison<br/>' +
    (objData.COLLECTOR_NAME ? nlapiEscapeXML(objData.COLLECTOR_NAME) : '') + '<br/>' +
    (objData.COLLECTOR_EMAIL ? nlapiEscapeXML(objData.COLLECTOR_EMAIL) : '') + '<br/>' +
    (objData.COLLECTOR_PHONE ? ('TEL:'+ nlapiEscapeXML(objData.COLLECTOR_PHONE)) : '') + '<br/>' +
    (objData.COLLECTOR_FAX ? ('FAX:'+ nlapiEscapeXML(objData.COLLECTOR_FAX)) : '') + '<br/>' +
    '</p>';
    str += '</td>';
	
	str += '</tr></table></td>';
		var date = new Date(); 
		var year = date.getFullYear();
		var month = date.getMonth();
		var firstDay = new Date(year, month, 1);
		var lastDay = new Date(year, month, 0);
		var lastyear = lastDay.getFullYear();
		var lastmonth = (lastDay.getMonth()+ 1).toString();
		var lastday = (lastDay.getDate()).toString();
		var length = lastmonth.length;
		if (length == 1) {
					lastmonth = ('0' + lastmonth );
				}
		var lengths = lastday.length;
		if (lengths == 1) {
					lastday = ('0' + lastday);
				}

		var lastmonthdate = (lastday+ '/' + lastmonth+ '/' + lastyear);
    str += '<td><table><tr><td> Date :' +  lastmonthdate + '</td></tr><tr><td>Client : ' + nlapiEscapeXML(customername) + '</td></tr></table></td>';
    str += '</tr>';

    str += '<tr>';
    str += '<td align="center" margin-top="40px" margin-left="100px" width="60%">RELANCE</td>';
    str += '<td>' + nlapiEscapeXML(customername) + '<br/>' +
        (objDatas.CUSTOMER_newaddr1 ? objDatas.CUSTOMER_newaddr1 : '') + '<br/>' + //' :EURO INFORMATION DEVELOPPT<br/>' +
        (objDatas.CUSTOMER_newaddr2 ? objDatas.CUSTOMER_newaddr2 : '') + '<br/>' +//'DEVELOPPEMETS<br/>' +
        (objDatas.CUSTOMER_newzip ? objDatas.CUSTOMER_newzip : '') + '' +//'34 RUE DU WACKEN<br/>' +
        (objDatas.CUSTOMER_country ? objDatas.CUSTOMER_country : '') + '</td>';//'67000 STRASBOURG </td>';
    str += '</tr>';

    str += '<tr height="40px" colspan="2">';
    str += '<td vertical-align="center">RAPPEL DES OPERATIONS ECHUES AU' + ' '+  lastmonthdate + '</td>';
    str += '</tr>';

    // Display only on first page
    if (line == 0) {
        str += '<tr>';
        str += '<td colspan="2">';
        str += 'Sauf erreur de notre part, nous constatons' + nlapiEscapeXML("qu’àce") + 'jour vous ' + nlapiEscapeXML("n'avez") + ' pas pris en considération <br/>' +
        'nos dernières relances.<br/>' +
        'En raison de ' + nlapiEscapeXML("l'ancienneté") + ' de vos débits, nous vous prions de bien vouloir nous<br/>' +
        'adresser votre règlement par retour.<br/>' +
        'Nous vous demandons à ' + nlapiEscapeXML("l'avenir") + ' de respecter les conditions de règlement mentionnées<br/>' +
        'sur vos factures. Dans cette attente, veuillez agréer, Messieurs, ' + nlapiEscapeXML("l'expression") + ' de nos<br/>' +
        'salutations distinguées.';
        str += '</td>';
        str += '</tr>';
    }
    str += '</table>';
    return str;
}

function MiddleTable(allResults, customername, objData, objDatas, stat1, stat2) {
    try {
        var str = '', sumOfPreviousPage = 0, sumOfDontLitige = 0;
        var cols = allResults[0].getAllColumns();
        var arrLoopLength = DivideArrayLength(allResults.length);
        var len = arrLoopLength.length;
		
        for (var countLoopLength = 0; countLoopLength < arrLoopLength.length; countLoopLength++) {
            if (countLoopLength != 0) str += Template3Detailed(objData, customername, objDatas, countLoopLength);

            str +=
                    '<table width="100%"><tr border-bottom="dotted">' +
                    '<th >Date</th>' +
                    '<th >Type</th>' +
                    '<th >Numéro</th>' +
                    '<th width="20%"> Libellé</th>' +
                    '<th width="12%">Stat1</th>' +
                    '<th width="12%">Stat2</th>' +
                    '<th>Départ</th>' +
                    '<th width="10%">Dest</th>' +
                    '<th>EUR</th>' +
                    '<th >Dont litige</th>' +
                    '</tr>' +

                    (countLoopLength != 0 ?
                    '<tr>' +
                    '<td></td>' +
                    '<td>Report</td>' +
                    '<td></td>' +
                    '<td></td>' +
                    '<td></td>' +
                    '<td></td>' +
                    '<td></td>' +
                    '<td></td>' +
                    '<td align="right">' + sumOfPreviousPage.toFixed(2).toString().replace('.', ',') + '</td>' +
                    '<td></td>' +
                    '</tr>' : '');

            var from = 0, to = 0;

            if (countLoopLength == 0) {
                from = 0, to = parseFloat(arrLoopLength[countLoopLength]);
            } else {
                for (var i = 0; i < countLoopLength; i++) {
                    from += parseFloat(arrLoopLength[i]);
                }
                for (var j = 0; j <= countLoopLength; j++) {
                    to += parseFloat(arrLoopLength[j]);
                }
            }
           
            for (var countRes = from; countRes < to; countRes++) {

                var colStat1 = (stat1 ? allResults[countRes].getValue(UDID_DET[stat1.toLowerCase()]) : '');     // stat1=udid1         UDID_DET[udid1] = custrecord_udid1      
                var colStat2 = (stat2 ? allResults[countRes].getValue(UDID_DET[stat2.toLowerCase()]) : '');

               // var type = allResults[countRes].getValue(cols[3]);
				 var type = allResults[countRes].getValue(cols[2]); // update for grouped search
		 
			 str += '<tr>' +
                '<td>' + nlapiEscapeXML(allResults[countRes].getValue(cols[1])) + '</td>' +
                '<td>' + (type == 'CustInvc' ? 'FA' : type == 'CustCred' ? 'AV' : 'RQ') + '</td>' +
                '<td>' + nlapiEscapeXML(allResults[countRes].getValue(cols[3])) + '</td>' +
                '<td>' + (nlapiEscapeXML(allResults[countRes].getValue(cols[2])) != 'PAYMENT' ?  
				nlapiEscapeXML(allResults[countRes].getValue(cols[4])) : nlapiEscapeXML(allResults[countRes].getValue(cols[5]))) + '</td>' +
                '<td>' + nlapiEscapeXML((colStat1 ? colStat1 : '')) + '</td>' +
                '<td>' + nlapiEscapeXML((colStat2 ? colStat2 : '')) + '</td>' +
                '<td>' + nlapiEscapeXML(allResults[countRes].getValue(cols[6])) + '</td>' +
                '<td>' + nlapiEscapeXML(allResults[countRes].getValue(cols[7])) + '</td>' +
                '<td align="right">' + nlapiEscapeXML(allResults[countRes].getValue(cols[8]) == 0 ? '0,00' : parseFloat(allResults[countRes].getValue(cols[8])).toFixed(2).toString().replace('.', ',')) + '</td>' +
                '<td align="right">' + (allResults[countRes].getValue(cols[9]) == 'T' ? nlapiEscapeXML(allResults[countRes].getValue(cols[8]) == 0 ? '0,00' : parseFloat(allResults[countRes].getValue(cols[8])).toFixed(2).toString().replace('.', ',')) : '') + '</td>' +
             '</tr>';
                sumOfPreviousPage += parseFloat(allResults[countRes].getValue(cols[8]));
                sumOfDontLitige += (allResults[countRes].getValue(cols[9]) == 'T' ? parseFloat(allResults[countRes].getValue(cols[8])) : 0);
            }

            if (countLoopLength == arrLoopLength.length - 1) {
                str += '<tr border-top="dotted"><td colspan="6">&nbsp;</td><td>Total : </td><td>&nbsp;</td><td align="right">' + sumOfPreviousPage.toFixed(2).toString().replace('.', ',') + '</td><td align="right">' + sumOfDontLitige.toFixed(2).toString().replace('.', ',') + '</td></tr>';
            }
            str += '</table>' +
                (countLoopLength < len - 1 ? '<pbr footer = "nlfooter' + (countLoopLength + 1) + '"/>' : '');
        }
        //str += '<tr><td colspan="10">' + DetailedFooter(customername) + '</td></tr>';

        //str += '</table>';
        return { str: str, sum: sumOfPreviousPage };
    } catch (ex) {
        nlapiLogExecution('DEBUG', 'ERROR in Middle Table', ex);
    }
}

function DivideArrayLength(allResultsLength) {
    var arrResultsLengths = [];
    var resLength = (allResultsLength);
    var firstLen = (resLength > 15 ? 15 : resLength);
    arrResultsLengths.push(firstLen);
    var remLen = (resLength > 15 ? (resLength - firstLen) : 0);

    if (remLen > 0) {
        var eachLoopLength = Math.floor(remLen / 20);
        for (var countLoops = 0; countLoops < eachLoopLength; countLoops++) {
            arrResultsLengths.push(20);
        }
        arrResultsLengths.push((remLen % 20));
    }
   // nlapiLogExecution('DEBUG', 'ARRAY', arrResultsLengths.toString());
    return arrResultsLengths;
}

function DetailedFooter(customername, sumOfPreviousPage, sumOfDontLitige, sumAll, lastFooter) {
	checkMetering();
    var str = '<table width="100%">';
		var date = new Date(); 
		var ndate = date.getDate();
		var year = date.getFullYear().toString();
		var month = date.getMonth().toString();
		var length = month.length;
		if (length == 1) {
					month = ('0' + month );
				}
		var lengths = ndate.length;
		if (lengths == 1) {
					ndate = ('0' + ndate);
				}
		var todaydate = (ndate + '/' + month + '/' + year);
    str += '<tr>';
    	str += '<td width="25%">Date :'+ todaydate+'<br/>Client : ' + nlapiEscapeXML(customername) + '<br/>Montant :       ' + parseFloat(sumAll).toFixed(2).toString().replace('.', ',') + ' EUR<br/></td>';
		
    str += '<td><table><tr><td>A adresser à : AMERICAN EXPRESS VOYAGES ' + nlapiEscapeXML("D'AFFAIRES") + '</td></tr>' +
        '<tr><td margin-left="110px">Comptabilité Clients</td></tr>' +
        '<tr><td margin-left="110px">18, rue des Deux Gares - Green Offi</td></tr>' +
        '<tr><td margin-left="110px">92500 Rueil Malmaison</td></tr>' +
       // '<tr><td>Conditions de règlement : 30 jours fin de mois</td></tr>' +
        '</table></td>';

    str += '<td width="25%">';

    str += '<table width="100%">';
    str += '<tr><td>' + (lastFooter ? 'En votre aimable règlement' : 'A reporter : ') + '</td></tr>';
    str += '<tr><td margin-left="20px">' + (lastFooter ? 'Net à payer : ' : '') + sumOfPreviousPage.toFixed(2).toString().replace('.', ',') + ' EUR</td></tr>';
    str += '<tr><td></td></tr>';
    str += '<tr><td></td></tr>';
    str += '<tr><td margin-left="50px"><pagenumber/></td></tr>';
    str += '</table>' +
        '</td>';
    str += '</tr>';
	
	str += '<tr><td colspan="3">'
	str += '<p align ="center" font-size="6px">' + nlapiEscapeXML("Global Business Travel France d/b/a American Express Voyages D'AFFAIRES(<< GBT >>) est une joint venture qui n’est pas détenue à 100% par American Express Company ou par l’une")+ "<br/>" + 
	nlapiEscapeXML("de ses filiales (<< American Express >>). << American Express Voyage d’Affaires >>, << American Express >> et le logo American Express sont des marques déposées d’American Express et sont utilisées sous contrat de licence.")+ "<br/>" +
nlapiEscapeXML("Global Business Travel France d/b/a American Express Voyages. Siège Social : 18, rue Deux Gares . 92500 Rueil-Malmaison . Téléphone : +33 1 47 77 77 07") + "<br/>"+
    nlapiEscapeXML("S.A.S.U au capital de 14.971.290 EUR. locataire-gérant. R.C.S. : Nanterre 304 475 338 . Immatriculée au registre des opérateurs de voyages et de séjours sous le numéro : IM 092 10 0028")+ "<br/>" +
    nlapiEscapeXML("Code A.P.E. : 7911Z . Garantie Financière : BNP Paribas, 16, boulevard des Italiens . 75009 Paris* . R.C.P. : GENERALI I.A.R.D. .7, Boulevard Haussmann – 75456 PARIS Cedex 09")+ "<br/>" + "TVA Intracommunautaire FR 15304475338"+
    '</p>';
	str += '</td></tr>'
    str += '</table>';
    return str;
}

function GetTime() {
    var now = new Date();
    var year = now.getFullYear();
    var month = now.getMonth() + 1;
    var day = now.getDate();
    var hour = now.getHours();
    var minute = now.getMinutes();

    if (month.toString().length == 1) {
        var month = '0' + month;
    }
    if (day.toString().length == 1) {
        var day = '0' + day;
    }
    if (hour.toString().length == 1) {
        var hour = '0' + hour;
    }
    if (minute.toString().length == 1) {
        var minute = '0' + minute;
    }

    // return (year + '' + month + '' + day + '' + hour + '' + minute);
    return ({ YYMMDDHHMN: year + '' + month + '' + day + '' + hour + '' + minute, YYYYMMDD: year + '' + month + '' + day });
}

var START_TIME = new Date().getTime();
function checkMetering() 
{
    // want to try to only check metering every 15 seconds
    var remainingUsage = context.getRemainingUsage();
    var currentTime = new Date().getTime();
    var timeDifference = currentTime - START_TIME;
    // changing to 15 minutes, should cause little if any impact, but will make runaway scripts faster to kill
    if (remainingUsage < 800 || timeDifference > 900000) {
        START_TIME = new Date().getTime();
        var status = nlapiYieldScript();
        nlapiLogExecution('AUDIT', 'STATUS = ', JSON.stringify(status));
    }
}