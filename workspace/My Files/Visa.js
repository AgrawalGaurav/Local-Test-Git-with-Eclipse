/*
 * Feb 11, 2016 modified by Surendra : file structure change
 * March 12: Modified by Gaurav to Update Bulk Invoice change
 * 
 * 1. script variable is not coming
 * 2. custom field to store file sequence number is not working
 */

function CreateBatchFile() 
{
	nlapiLogExecution('DEBUG', 'Start', '********************');
    try {
        var folderId = nlapiGetContext().getSetting('SCRIPT', 'custscript_gbt_visafrancefolder');
        nlapiLogExecution('DEBUG', 'Folder Id', folderId);
		
//		var ftime = GetTime().DDMMYY;
        var filePayload = '';
		var headerDate = GetTime().DDMMYY;
		var headerTime = GetTime().HHMMSS;
		var remittance = CustomSeqChech().fileSeqNum; //-------- get the incremented number that should be update by increment each time
		remittance = generateZeros(remittance.toString(), 6, 'R', '0');
		nlapiLogExecution('DEBUG', 'Info', 'remittance = ' + remittance);
// file header		
		var filehead = '00' + addSpace(8) +'822822'+'30004'+'0'+'5'+addSpace(14)+ headerDate + headerTime + remittance +'000000'+addSpace(8)+addSpace(8)+'13'+ addSpace(60) + addSpace(101) + '\r\n';
		filePayload = filehead;
		var objSeq = CustomSeqChech();
		seqId = objSeq.seqId;
		fileSeqNum = objSeq.fileSeqNum.toString();
		
		
		var SOs = [], INVs = [], CMs = [];
		var remittanceGroup = ['VISA','MASTER'];
		var remittanceIdentifier = 0;
		var numberOfRecords = 0;
// ------------ Remittance Block -------------------------------START------------------------------------
		for (var remittanceIndex = 0; remittanceIndex < remittanceGroup.length; remittanceIndex++) 
		{
			var remittanceElement = remittanceGroup[remittanceIndex];
			remittanceIdentifier++;
			
			var remittanceIdentifierStr = generateZeros(remittanceIdentifier.toString(), 6, 'R', '0');
			
			var total_Remittance_Amount = 0.0;// with 16 digits
			var SIRET_C11 = '00000304475338';               //--- need to set
			var BNP_Contract_Number_C12 = addSpace(7);		
			var pointOfSale_D31 = addSpace(16);				
			var issuing_Bank_Establishment_Code_D4 = addSpace(5);
			var issuing_Bank_Agency_Code_D5 = addSpace(5);
			var issuing_Bank_Account_Number_D6 = addSpace(11);
			
			var remittanceHeader = '01' + addSpace(2) + '822822' + '822822' + SIRET_C11 + BNP_Contract_Number_C12 + headerDate + headerTime + remittanceIdentifierStr + '5' +
					pointOfSale_D31 + 'AEV             ' + addSpace(10) + issuing_Bank_Establishment_Code_D4 + issuing_Bank_Agency_Code_D5 + issuing_Bank_Account_Number_D6 +
					'978' + addSpace(8) + '1' + addSpace(8) + addSpace(12) + addSpace(11) + addSpace(78) + '\r\n';
			filePayload += remittanceHeader;								
			var totaldebitamount=0, totalcreditamount=0, debittransactions=0, credittransactions=0, totalrecords=0;
			
			var search = GetAllResult(remittanceElement);
			var tranhead = '';
			var transaction_Sequence_Number = 0;
			if(search)
			{
			  var recId;
	//------------ Transaction Block ------------------------------START-------------------------------------						
				for (var countRes = 0; countRes < search.length; countRes++) 
				{
					/* Gaurav's Code to Update Script to check Bulk Invoice */
				var type = search[countRes].getValue('type', 'appliedtotransaction');

                        if (type == 'SalesOrd') {
                            type = 'salesorder';
                         //   soIds.push(search[countRes].getValue('appliedtotransaction'));
                            recId = search[countRes].getValue('appliedtotransaction');
                        } else if (type == 'CustInvc') {
                            type = 'invoice';
                          //  invIds.push(search[countRes].getValue('internalid', 'appliedtotransaction'));
                            recId = search[countRes].getValue('appliedtotransaction');
                        } else if (type = 'CustCred') {
                            type = 'creditmemo';
                           // crdMemIds.push(search[countRes].getValue('applyingtransaction'));
                            recId = search[countRes].getValue('applyingtransaction');
                        } else {
                            return;
                        }
						
						//var filters = new Array();
						var columns = new Array();
						
				var filterExpression = [['mainline','is','T'], 'AND', ['internalid','is',recId]];
						columns[0] = new nlobjSearchColumn('internalid');
						columns[1] = new nlobjSearchColumn('type');
						columns[2] = new nlobjSearchColumn('datecreated').setSort(true);
						columns[3] = new nlobjSearchColumn('fxamount');
						var searchinternal = nlapiSearchRecord('transaction',null,filterExpression,columns);

						for (var i = 0; searchinternal && i < searchinternal.length; i++) 
						{
									var searchresultt = searchinternal[i];
									var recIds =  searchresultt.getId();
									var resulttype = searchresultt.getValue('type');
									if(resulttype == 'CustInvc')
									{
									   resulttype = 'invoice';
									}
									else
									{
									   resulttype = 'creditmemo';
									}
				           var loadRec = nlapiLoadRecord(resulttype, recIds);
					var cccolumns = searchinternal[i].getAllColumns();
					/* Bulk Invoice Code ends here*/
					CheckMetering();
					transaction_Sequence_Number++;
					var result = search[countRes];
					var columns = search[countRes].getAllColumns();
					//var appliedtype = result.getValue(columns[0]); // commented by Gaurav.
					var appliedtype = resulttype;			
					var ccnumber = result.getValue(columns[1]);
					var dateCreated = result.getValue(columns[2]);// commented by Gaurav.
					//var dateCreated = loadRec.getFieldValue('trandate');
					//var tranamount = result.getValue(columns[3]); // commented by Gaurav. 
					var tranamount = searchinternal[i].getValue(columns[3]);
					nlapiLogExecution('DEBUG','TRAN AMT',tranamount);
					//var appliedtransaction = result.getValue(columns[4]); // commented by Gaurav. 
					var appliedtransaction = recId; // is this Internal Id
					var ccExpireDate = result.getValue(columns[5]);
					var scriptedAuthCode = result.getValue(columns[6]);
					//var applyTransactionNumber = result.getValue(columns[7]);// commented by Gaurav. 
					var applyTransactionNumber = loadRec.getFieldValue('tranid');
					var sirenNumber = result.getValue(columns[8]);                // -- not in use yet
					
					nlapiLogExecution('DEBUG', 'Info', 'tranamount = ' + tranamount + ' ccExpireDate = ' + ccExpireDate + ' scriptedAuthCode = ' + scriptedAuthCode + ' applyTransactionNumber = ' + applyTransactionNumber);
					
					tranamount = parseFloat(tranamount);
					
					var operationCode = 'DT';// "DT" for Debit, "CT" for Credit
					if(appliedtype == 'SalesOrd'){
						totaldebitamount += Math.abs(tranamount);
						debittransactions++;
						SOs.push(appliedtransaction);
					}
					else if(appliedtype == 'invoice'){
						totaldebitamount += Math.abs(tranamount);
						debittransactions++;
						nlapiLogExecution('DEBUG','DEBIT count',debittransactions);
						INVs.push(appliedtransaction);
					}
					else if(appliedtype == 'creditmemo'){
						operationCode = 'CT';
						totalcreditamount += Math.abs(tranamount);
						credittransactions++;
						nlapiLogExecution('DEBUG','CREDIT count',credittransactions);
						CMs.push(appliedtransaction);
					}
					totalrecords++;
					total_Remittance_Amount += Math.abs(tranamount);
										
					var transactionDate = getStringToDate(dateCreated).DDMMYY;// DDMMYY 
					var transactionTime = getStringToDate(dateCreated).HHMMSS;// HHMMSS
					var cardExpirationDate = getExpirationDate(ccExpireDate); //  MMYY
					var travelInvoiceNumberArray = (applyTransactionNumber.toString()).split('-');
					var travelInvoiceNumber = generateZeros(travelInvoiceNumberArray[1], 12, 'L', ' ');// with 12 digits
					var authorizationNumber = '';// with 6 digits
					if(scriptedAuthCode) authorizationNumber = generateZeros(scriptedAuthCode, 6, 'L', ' ');
					else authorizationNumber = addSpace(6);
						
					tranamount = getAmountString(Math.abs(tranamount));
					tranamount = generateZeros(tranamount.toString(), 16, 'R', '0');
					
					nlapiLogExecution('DEBUG', 'Info', 'transaction time = ' + transactionTime);
					
					tranhead += '03' + operationCode + remittanceIdentifierStr + generateZeros(transaction_Sequence_Number.toString(), 6, 'R', '0')+ '001' + '20' + '00' + '99' + addSpace(12) + transactionDate + transactionTime +
							'6' + generateZeros(ccnumber.toString(), 19, 'L', '0') + '000' + cardExpirationDate + '000' + '0000000' + addSpace(13) + addSpace(4) + travelInvoiceNumber +
							addSpace(24) + '9' + authorizationNumber  + '00' + generateZeros('0', 16, 'R', '0') + '000000' + '000000' + 
							addSpace(11) + addSpace(2) + addSpace(16) + addSpace(1) + addSpace(11) + addSpace(1) + addSpace(1) + addSpace(1) +
							'4722' + tranamount + '\r\n';
	
				}// end of transaction for loop
				}
	//------------ Transaction Block ------------------------------END-------------------------------------						
			}// end of transaction if block 
			
			filePayload += tranhead;
			
			numberOfRecords += transaction_Sequence_Number;
						
			var totalNumberofNonMonetaryTransactions = '00000000';// with 8 ditigs -- to set
			total_Remittance_Amount = getAmountString(Math.abs(total_Remittance_Amount));
			
			total_Remittance_Amount = generateZeros(total_Remittance_Amount.toString(), 16, 'R', '0');
			
			nlapiLogExecution('DEBUG', 'Info', 'total_Remittance_Amount after = ' + total_Remittance_Amount);
			nlapiLogExecution('DEBUG', 'Info', 'totalcreditamount before = ' + totalcreditamount);
			nlapiLogExecution('DEBUG', 'Info', 'totaldebitamount before = ' + totaldebitamount);

			totalcreditamount = getAmountString(totalcreditamount);
			totaldebitamount = getAmountString(totaldebitamount);
			
			
			totalcreditamount = generateZeros(totalcreditamount.toString(), 16, 'R', '0');
			totaldebitamount = generateZeros(totaldebitamount.toString(), 16, 'R', '0');
			credittransactions = generateZeros(credittransactions.toString(), 8, 'R', '0');
			debittransactions = generateZeros(debittransactions.toString(), 8, 'R', '0');
			
			nlapiLogExecution('DEBUG', 'Credit final',totalcreditamount);
			nlapiLogExecution('DEBUG', 'Debit Final',totaldebitamount);

			
			var remittanceFooter = '08' + addSpace(2) + '822822' + '822822' + SIRET_C11 + BNP_Contract_Number_C12 + headerDate + headerTime +
			remittanceIdentifierStr + '5' + '978' +  generateZeros(transaction_Sequence_Number.toString(), 8, 'R', '0') + totalNumberofNonMonetaryTransactions +
					credittransactions + totalcreditamount +
					debittransactions + totaldebitamount +
					total_Remittance_Amount + addSpace(101) + '\r\n';
			filePayload += remittanceFooter;
					
		}// end of remittance group for loop
// ------------ Remittance Block -------------------------------END------------------------------------		
		
		var filefoot = '09'+ addSpace(8) + '822822' + '30004' + '0' + '5' + addSpace(14) + headerDate + headerTime + 
			remittance + '000000' + generateZeros(remittanceIdentifier.toString(), 8, 'R', '0') + generateZeros(numberOfRecords.toString(), 8, 'R', '0') + '13' + addSpace(60) + addSpace(101) +'\r\n';
		
		filePayload += filefoot;
		
		CheckMetering();
		var createFile = nlapiCreateFile('VI' + GetTime().DDMMYY + remittance, 'PLAINTEXT', filePayload);
//        createFile.setFolder(folderId);
		createFile.setFolder('55862');
        nlapiSubmitFile(createFile);
		CheckMetering();
		
		nlapiSubmitField('customrecord_gbt_cc_ccseqchecknn', seqId, 'custrecord_gbt_cc_visafrancesequence', fileSeqNum);
		nlapiLogExecution('DEBUG', 'Info', 'custom record internal id = ' + seqId + 'file sequence number = ' + fileSeqNum);
		
//		if (SOs.length > 0) {
//            for (var countSO = 0; countSO < SOs.length; countSO++) {
//				CheckMetering();
//                nlapiSubmitField('salesorder', SOs[countSO], 'custbody_gbt_cc_transactionextracted', 'T');
//			}
//        }

		if (INVs.length > 0) 
		{
           for (var countINV = 0; countINV < INVs.length; countINV++) 
		   {
				CheckMetering();
                nlapiSubmitField('invoice', INVs[countINV], 'custbody_gbt_cc_transactionextracted', 'T');
			}
        }
		
		if (CMs.length > 0) 
		{
          for (var countCM = 0; countCM < CMs.length; countCM++) 
		  {
			 nlapiSubmitField('creditmemo', CMs[countCM], 'custbody_gbt_cc_transactionextracted', 'T');
		  }
       }
		
    }
	catch (ex) {
        nlapiLogExecution('DEBUG', 'ERROR IN CreateBatchFile():', ex);
    }
	nlapiLogExecution('DEBUG', 'Completed', '********************');
}

function getAmountString(amount){
	var amountArray = (amount.toString()).split('.');
	secondAmountPart = amountArray[1];
	if(secondAmountPart)
	{
		if(secondAmountPart.length == 1) secondAmountPart += '0';
		else if(secondAmountPart.length > 2) secondAmountPart = secondAmountPart.substring(0,2);
	}
	else secondAmountPart = '00';
				
	return amountArray[0] + secondAmountPart;
}

function CustomSeqChech() {
    var searchSeq = nlapiSearchRecord('customrecord_gbt_cc_ccseqchecknn');
    var seqId, fileSeqNum;
    if (searchSeq) {
        var data = nlapiLookupField('customrecord_gbt_cc_ccseqchecknn', searchSeq[0].getId(), 'custrecord_gbt_cc_visafrancesequence');//create this field on custom record?or use same sequence
        fileSeqNum = parseInt(data) + 1;
        seqId = searchSeq[0].getId();
        nlapiSubmitField('customrecord_gbt_cc_ccseqchecknn', seqId, 'custrecord_gbt_cc_visafrancesequence', fileSeqNum);
    } else {
        var createSeq = nlapiCreateRecord('customrecord_gbt_cc_ccseqchecknn');
        createSeq.setFieldValue('name', 'Sequence Check');
//        createSeq.setFieldValue('custrecord_gbt_cc_visafrancesequence', '1');
        seqId = nlapiSubmitRecord(createSeq, null, true);
        fileSeqNum = 1;
    }
    var obj = { seqId: seqId, fileSeqNum: fileSeqNum };
    return obj;
}

function generateZeros(str, overalllength, justify, ch){
	if(!ch)
		ch = '0';
	var len = 0;
	if(!str)
		str = '';
	if(str)
		len = str.length;
	if(!justify)
		justify = 'L';

	if(len>overalllength){//this is the trimmer
		str = str.substring(0, overalllength);
		return str;
	}
	
	var zeroslength =  overalllength - len,zeros = '';
	for(var i=0;i<zeroslength;i++){
		zeros+=ch;
	}
	if(justify == 'L'){
		return str+zeros;
	}
	else if(justify == 'R'){
		return zeros+str;
	}
}

function GetTime() {
    var now = new Date();
    var year = now.getFullYear();
    var month = now.getMonth() + 1;
    var day = now.getDate();
    var hour = now.getHours();
    var minute = now.getMinutes();
	var seconds = now.getSeconds();
    if (month.toString().length == 1) {
        month = '0' + month;
    }
    if (day.toString().length == 1) {
        day = '0' + day;
    }
    if (hour.toString().length == 1) {
        hour = '0' + hour;
    }
    if (minute.toString().length == 1) {
        minute = '0' + minute;
    }
    if(seconds == 0)
    	seconds = '00';
	if(seconds.toString().length == 1){
		seconds = '0' + seconds;
	}

    return ({ DDMMYYHHMMSS: day + '' + month + '' + year.toString().substring(2, 4) + '' + hour + '' + minute + '' + seconds, YYYYMMDD: year + '' + month + '' + day, DDMMYY: day + '' + month + '' + year.toString().substring(2, 4), HHMMSS: hour + '' + minute + '' + seconds });
}

function getStringToDate(dateTime) 
{
	var date = nlapiStringToDate(dateTime,'datetimetz');

    var year = date.getFullYear();
    var month = date.getMonth() + 1;
    var day = date.getDate();
    var hour = date.getHours();
    var minute = date.getMinutes();
	var seconds = date.getSeconds();
    if (month.toString().length == 1) {
        month = '0' + month;
    }
    if (day.toString().length == 1) {
        day = '0' + day;
    }
    if (hour.toString().length == 1) {
        hour = '0' + hour;
    }
    if (minute.toString().length == 1) {
        minute = '0' + minute;
    }
    if(seconds == 0)
    	seconds = '00';
	if(seconds.toString().length == 1){
		seconds = '0' + seconds;
	}

    return ({ DDMMYYHHMMSS: day + '' + month + '' + year.toString().substring(2, 4) + '' + hour + '' + minute + '' + seconds, YYYYMMDD: year + '' + month + '' + day, DDMMYY: day + '' + month + '' + year.toString().substring(2, 4), HHMMSS: hour + '' + minute + '' + seconds });
}
function getExpirationDate(expDate)
{
	var strArray = expDate.split('/');

	var month = strArray[0];
	var year = strArray[1];

	if (month.toString().length == 1) {
	        month = '0' + month;
	    }
	year = year.toString().substring(2, 4);
	
	return month + '' + year;
}

function GetAllResult(remittanceElement) 
{
	var filters = [];
	
	if(remittanceElement == 'VISA') 
		filters = [new nlobjSearchFilter('custbody_gbt_visacheckbox', null, 'is', 'T')];
    else 
		filters = [new nlobjSearchFilter('custbody_gbt_cc_mastercardcheck', null, 'is', 'T')];
	
	var search = nlapiLoadSearch(null, 'customsearch_gbt_cc_paymentinvccfeedvisa');//create this save search
	var allResultsArray = [];
	
	if (filters) search.addFilters(filters);
    var searchResults = search.runSearch();
	
	//if(remittanceElement == 'VISA') search.addFilter(new nlobjSearchFilter('custbody_gbt_visacheckbox', null, 'is', 'T'));
   // else search.addFilter(new nlobjSearchFilter('custbody_gbt_cc_mastercardcheck', null, 'is', 'T'));
	
	//search.addFilters(filters);

    if (searchResults != null) {
        var SearchfromIndex = 0;
        var SearchtoIndex = 1000;
        var resultSet;
        do {
			CheckMetering();
            // fetch one result set
            resultSet = searchResults.getResults(SearchfromIndex, SearchfromIndex + SearchtoIndex);//(0+1000),(1000+1000)......

            // increase pointer
            SearchfromIndex = SearchfromIndex + SearchtoIndex;
            for (var i = 0; i < resultSet.length; i++) {
                allResultsArray.push(resultSet[i]);
            }
            // once no records are returned we already got all of them
        } while (resultSet.length > 0)
    }
	
	var search = nlapiLoadSearch(null, 'customsearch_gbt_cc_refundccfeed_visa');//create this save search

	if (filters) search.addFilters(filters);
    var searchResults = search.runSearch();
	
	//if(remittanceElement == 'VISA') search.addFilter(new nlobjSearchFilter('custbody_gbt_visacheckbox', null, 'is', 'T'));
   // else search.addFilter(new nlobjSearchFilter('custbody_gbt_cc_mastercardcheck', null, 'is', 'T'));
	
//	search.addFilters(filters);
    var searchResults = search.runSearch();
    if (searchResults != null) {
        var SearchfromIndex = 0;
        var SearchtoIndex = 1000;
        var resultSet;
        do {
			CheckMetering();
            // fetch one result set
            resultSet = searchResults.getResults(SearchfromIndex, SearchfromIndex + SearchtoIndex);//(0+1000),(1000+1000)......

            // increase pointer
            SearchfromIndex = SearchfromIndex + SearchtoIndex;
            for (var i = 0; i < resultSet.length; i++) {
                allResultsArray.push(resultSet[i]);
            }
            // once no records are returned we already got all of them
        } while (resultSet.length > 0)
    }
    return allResultsArray;
}

function CheckMetering() {
    var CTX = nlapiGetContext();
    var remainingUsage = CTX.getRemainingUsage();
    if (remainingUsage < 500) {
        var status = nlapiYieldScript();
        nlapiLogExecution('AUDIT', 'STATUS = ', JSON.stringify(status));
    }
}

function isNull(str){
	if(str == '' || str == null)
		return true;
	else	
		return false;
}

function addSpace(size)
{
	var space = '';
	for (var index = 0; index < size; index++)
		space = space + ' ';
	return space;
}

String.prototype.Normalize = function () {
    var a = ['Ã€', 'Ã�', 'Ã‚', 'Ãƒ', 'Ã„', 'Ã…', 'Ã†', 'Ã‡', 'Ãˆ', 'Ã‰', 'ÃŠ', 'Ã‹', 'ÃŒ', 'Ã�', 'ÃŽ', 'Ã�', 'Ã�', 'Ã‘', 'Ã’', 'Ã“', 'Ã”', 'Ã•', 'Ã–', 'Ã˜', 'Ã™', 'Ãš', 'Ã›', 'Ãœ', 'Ã�', 'ÃŸ', 'Ã ', 'Ã¡', 'Ã¢', 'Ã£', 'Ã¤', 'Ã¥', 'Ã¦', 'Ã§', 'Ã¨', 'Ã©', 'Ãª', 'Ã«', 'Ã¬', 'Ã­', 'Ã®', 'Ã¯', 'Ã±', 'Ã²', 'Ã³', 'Ã´', 'Ãµ', 'Ã¶', 'Ã¸', 'Ã¹', 'Ãº', 'Ã»', 'Ã¼', 'Ã½', 'Ã¿', 'Ä€', 'Ä�', 'Ä‚', 'Äƒ', 'Ä„', 'Ä…', 'Ä†', 'Ä‡', 'Äˆ', 'Ä‰', 'ÄŠ', 'Ä‹', 'ÄŒ', 'Ä�', 'ÄŽ', 'Ä�', 'Ä�', 'Ä‘', 'Ä’', 'Ä“', 'Ä”', 'Ä•', 'Ä–', 'Ä—', 'Ä˜', 'Ä™', 'Äš', 'Ä›', 'Äœ', 'Ä�', 'Äž', 'ÄŸ', 'Ä ', 'Ä¡', 'Ä¢', 'Ä£', 'Ä¤', 'Ä¥', 'Ä¦', 'Ä§', 'Ä¨', 'Ä©', 'Äª', 'Ä«', 'Ä¬', 'Ä­', 'Ä®', 'Ä¯', 'Ä°', 'Ä±', 'Ä²', 'Ä³', 'Ä´', 'Äµ', 'Ä¶', 'Ä·', 'Ä¹', 'Äº', 'Ä»', 'Ä¼', 'Ä½', 'Ä¾', 'Ä¿', 'Å€', 'Å�', 'Å‚', 'Åƒ', 'Å„', 'Å…', 'Å†', 'Å‡', 'Åˆ', 'Å‰', 'ÅŒ', 'Å�', 'ÅŽ', 'Å�', 'Å�', 'Å‘', 'Å’', 'Å“', 'Å”', 'Å•', 'Å–', 'Å—', 'Å˜', 'Å™', 'Åš', 'Å›', 'Åœ', 'Å�', 'Åž', 'ÅŸ', 'Å ', 'Å¡', 'Å¢', 'Å£', 'Å¤', 'Å¥', 'Å¦', 'Å§', 'Å¨', 'Å©', 'Åª', 'Å«', 'Å¬', 'Å­', 'Å®', 'Å¯', 'Å°', 'Å±', 'Å²', 'Å³', 'Å´', 'Åµ', 'Å¶', 'Å·', 'Å¸', 'Å¹', 'Åº', 'Å»', 'Å¼', 'Å½', 'Å¾', 'Å¿', 'Æ’', 'Æ ', 'Æ¡', 'Æ¯', 'Æ°', 'Ç�', 'ÇŽ', 'Ç�', 'Ç�', 'Ç‘', 'Ç’', 'Ç“', 'Ç”', 'Ç•', 'Ç–', 'Ç—', 'Ç˜', 'Ç™', 'Çš', 'Ç›', 'Çœ', 'Çº', 'Ç»', 'Ç¼', 'Ç½', 'Ç¾', 'Ç¿'];
    var b = ['A', 'A', 'A', 'A', 'A', 'A', 'A', 'C', 'E', 'E', 'E', 'E', 'I', 'I', 'I', 'I', 'D', 'N', 'O', 'O', 'O', 'O', 'O', 'O', 'U', 'U', 'U', 'U', 'Y', 's', 'a', 'a', 'a', 'a', 'a', 'a', 'a', 'c', 'e', 'e', 'e', 'e', 'i', 'i', 'i', 'i', 'n', 'o', 'o', 'o', 'o', 'o', 'o', 'u', 'u', 'u', 'u', 'y', 'y', 'A', 'a', 'A', 'a', 'A', 'a', 'C', 'c', 'C', 'c', 'C', 'c', 'C', 'c', 'D', 'd', 'D', 'd', 'E', 'e', 'E', 'e', 'E', 'e', 'E', 'e', 'E', 'e', 'G', 'g', 'G', 'g', 'G', 'g', 'G', 'g', 'H', 'h', 'H', 'h', 'I', 'i', 'I', 'i', 'I', 'i', 'I', 'i', 'I', 'i', 'I', 'i', 'J', 'j', 'K', 'k', 'L', 'l', 'L', 'l', 'L', 'l', 'L', 'l', 'l', 'l', 'N', 'n', 'N', 'n', 'N', 'n', 'n', 'O', 'o', 'O', 'o', 'O', 'o', 'O', 'o', 'R', 'r', 'R', 'r', 'R', 'r', 'S', 's', 'S', 's', 'S', 's', 'S', 's', 'T', 't', 'T', 't', 'T', 't', 'U', 'u', 'U', 'u', 'U', 'u', 'U', 'u', 'U', 'u', 'U', 'u', 'W', 'w', 'Y', 'y', 'Y', 'Z', 'z', 'Z', 'z', 'Z', 'z', 's', 'f', 'O', 'o', 'U', 'u', 'A', 'a', 'I', 'i', 'O', 'o', 'U', 'u', 'U', 'u', 'U', 'u', 'U', 'u', 'U', 'u', 'A', 'a', 'A', 'a', 'O', 'o'];
    var str = this;
    var i = a.length;

    while (i--)
        str = str.replaceAll(a[i], b[i]);
    return str;
};

String.prototype.replaceAll = function (replaceThis, withThis) {
    var re = new RegExp(replaceThis, "g");
    return this.replace(re, withThis);
};