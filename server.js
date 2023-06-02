const express = require('express');
const cors = require('cors');
const app = express();

const odbc = require('odbc');
const connectionString ='Driver={SQL Server};Server=FCNYSQL01;Database=Freedom;UID=wamp;PWD=wamp;'
const port = process.env.PORT || 3001;

//"DRIVER=SQL Server;Server=FCNYSQL01;Database=Freedom;uid=wamp;password=wamp;   JOIN medflyt.vw.visitinstance ON "
app.use(express.json());
app.use(cors())
app.get('/', (req, res)=> {
    res.send("Server Running")
})
app.get('/:caregiverCode/:order', async function(req, res){
    
   

    (async () => {
        try {
            console.log("start");
            
            const connection = await odbc.connect(connectionString);
            console.log('Connected to SQL Server');
            
            //TABLE: freedommobile.mobile.tblcaregivercodes_encrypted 
            //INFO: Caregiver Basic Information
            const caregiverInfo = await connection.query(`
                SELECT c.id AS 'ID', c.SFID AS 'Salesforce ID', c.caregiverID AS 'Caregiver ID',
                    CONCAT(c.firstName, ' ', c.lastName) AS 'Name',
                    c.firstname AS 'First Name', c.lastname AS 'Last Name', c.gender AS 'Gender',
                    c.primarylanguage AS 'Primary Language', c.dob AS 'Date of Birth', c.email AS 'Email',
                    c.phone AS 'Phone', c.mobilephone AS 'Mobile Phone', c.address AS 'Address',
                    c.lat AS 'Latitude', c.lon AS 'Longitude', s.Medflyt_Caregiver_ID__c AS 'Medflyt Caregiver ID',
                    c.instapayrapidcard AS 'Instant Pay Rapid Card'
                FROM freedommobile.mobile.tblcaregivercodes_encrypted c
                JOIN Salesforce.salesforce.contacts2 s ON c.SFID = s.id
                WHERE c.caregivercode = ?
                `, [req.params["caregiverCode"]]);
           
            // TABLE: medflyt.vw.visitinstance
            // INFO: Medfylt Visits and how they clock-in/out
            const visitInfo = await connection.query(`
                SELECT m.mfscheduleid, m.scheduledstarttime, m.scheduledendtime, m.visitstarttime, m.visitendtime,
                    m.clockintype, m.clockouttype
                FROM medflyt.vw.visitinstance m
                WHERE m.CaregiverDisplayedID = ? 
                    AND m.visitDate <= CAST(GETDATE() AS DATE)
                    AND m.visitdate >= CAST(GETDATE() - 30 AS DATE)
                ORDER BY m.visitDate ${req.params["order"]}
                `, [req.params["caregiverCode"]]);


            const latestClockinOut = await connection.query(`SELECT TOP 1 ci.visitid AS 'Visit ID', co.visitid AS 'Visit ID (Clock-out)',ci.visitdate AS 'Visit Date (Clock-in)', co.visitdate AS 'Visit Date (Clock-out)', ci.CaregiverID AS 'Caregiver ID', ci.patientid AS 'Patient ID', 
            ci.GPSLatitude AS 'Caregiver Latitude (Clock-in)', ci.GPSLongitude AS 'Caregiver Longitude (Clock-in)', ci.plat AS 'Patient Latitude (Clock-in)', ci.plon AS 'Patient Longitude (Clock-in)',
            co.GPSLatitude AS 'Caregiver Latitude (Clock-out)', co.GPSLongitude AS 'Caregiver Longitude (Clock-out)', co.plat AS 'Patient Latitude (Clock-out)', co.plon AS 'Patient Longitude (Clock-out)', 
            ci.GPSDistanceInfeet AS 'Distance From Patient In Feet (Clock-in)', ci.ConfirmationInType AS 'Confirmation Clock-in Type', ci.GPSAccuracy AS 'GPS Accuracy (Clock-in)',
            co.GPSDistanceInfeet AS 'Distance From Patient In Feet (Clock-out)', co.ConfirmationOutType AS 'Confirmation Clock-out Type',  co.GPSAccuracy AS 'GPS Accuracy (Clock-out)'
            FROM freedommobile.mobile.tblcaregivercodes_encrypted c 
            JOIN freedommobile.mobile.tblclockin ci ON c.caregiverID = ci.CaregiverID 
			JOIN freedommobile.mobile.tblclockout co ON ci.visitid = co.visitid
            WHERE c.caregivercode = ?
            AND ci.visitdate >= DATEADD(day, -30, GETDATE())
            ORDER BY ci.visitdate DESC`, [req.params["caregiverCode"]]);


             // TABLE: freedommobile.mobile.tblclockout
            // INFO: Latest Clock-out
            
            const clockInOutInfo30All =await connection.query(`SELECT ci.visitid AS 'Visit ID',
            co.visitid AS 'Visit ID (Clock-out)',
            ci.visitdate AS 'Visit Date (Clock-in)',
            co.visitdate AS 'Visit Date (Clock-out)',
            ci.CaregiverID AS 'Caregiver ID',
            ci.patientid AS 'Patient ID',
            ci.GPSLatitude AS 'Caregiver Latitude',
            ci.GPSLongitude AS 'Caregiver Longitude',
            ci.plat AS 'Patient Latitude',
            ci.plon AS 'Patient Longitude',
            ci.GPSDistanceInfeet AS 'Distance From Patient In Feet (Clock-in)',
            ci.ConfirmationInType AS 'Confirmation Clock-in Type',
            ci.GPSAccuracy AS 'GPS Accuracy (Clock-in)',
            COALESCE(CONVERT(varchar(20), co.GPSDistanceInfeet), '-') AS 'Distance From Patient In Feet (Clock-out)',
            COALESCE(co.ConfirmationOutType, '-') AS 'Confirmation Clock-out Type',
            COALESCE(CONVERT(varchar(20), co.GPSAccuracy), '-') AS 'GPS Accuracy (Clock-out)'
                FROM freedommobile.mobile.tblcaregivercodes_encrypted c
                JOIN freedommobile.mobile.tblclockin ci ON c.caregiverID = ci.CaregiverID
                LEFT JOIN freedommobile.mobile.tblclockout co ON ci.visitid = co.visitid
                WHERE c.caregivercode= ?
                AND ci.visitdate >= DATEADD(day, -30, GETDATE())
                ORDER BY ci.visitdate DESC`, [req.params["caregiverCode"]]);


             // TABLE: freedommobile.mobile.tblclockin
            // INFO: Latest Clock-in
            
            const clockInOutInfo30 = await connection.query(`SELECT ci.visitid AS 'Visit ID', co.visitid AS 'Visit ID (Clock-out)',ci.visitdate AS 'Visit Date (Clock-in)', co.visitdate AS 'Visit Date (Clock-out)', ci.CaregiverID AS 'Caregiver ID', ci.patientid AS 'Patient ID', 
            ci.GPSLatitude AS 'Caregiver Latitude', ci.GPSLongitude AS 'Caregiver Longitude', ci.plat AS 'Patient Latitude', ci.plon AS 'Patient Longitude', 
            ci.GPSDistanceInfeet AS 'Distance From Patient In Feet (Clock-in)', ci.ConfirmationInType AS 'Confirmation Clock-in Type', ci.GPSAccuracy AS 'GPS Accuracy (Clock-in)',
            co.GPSDistanceInfeet AS 'Distance From Patient In Feet (Clock-out)', co.ConfirmationOutType AS 'Confirmation Clock-out Type',  co.GPSAccuracy AS 'GPS Accuracy (Clock-out)'
            FROM freedommobile.mobile.tblcaregivercodes_encrypted c 
            JOIN freedommobile.mobile.tblclockin ci ON c.caregiverID = ci.CaregiverID 
			JOIN freedommobile.mobile.tblclockout co ON ci.visitid = co.visitid
            WHERE c.caregivercode= ?
            AND ci.visitdate >= DATEADD(day, -30, GETDATE())
            ORDER BY ci.visitdate DESC`, [req.params["caregiverCode"]]);


            // TABLE: Salesforce...[case]
            // INFO: Cases in Salesforce
            
            const caseDescriptions = await connection.query(`
            SELECT OwnerId AS 'Owner ID', Type, CreatedDate AS 'Created Date', Status, SuppliedName As 'Supplied Name', SuppliedEmail AS 'Supplied Email', id AS 'ID', ContactId AS 'Contact ID', Subject, Description
            FROM Salesforce.dbo.[case]
			WHERE recordtypeid ='0124v000001CISUAA4'
            order by createddate desc
          `);
          


             // TABLE: Salesforce...[case]
            // INFO: Cases in Salesforce
            const appInfo = await connection.query(`SELECT 
            dayweek AS 'Days', 
            vdate AS 'Date',
            A_universe AS 'Universal',
            B_confirmed AS 'Confirmed',
            B_confirmed_mobile AS 'Confirmed by Mobile',
            C_totalnotcomfirmed AS 'Total Not Confirmed',
            D_noattempts AS 'No Attempt',
            E_onlyclockedout AS 'Only Clocked-Out',
            F_onlyclockedin AS 'Only Clocked-In',
            fully_confirmed AS 'Fully Confirmed',
            fullly_confirmed_mobile AS 'Fully Confimred Mobile'
            FROM dbIntegrations.report.dailyvisits
            ORDER BY vdate DESC`);
            

            const result = {
                caregiverInfo, 
                visitInfo, 
                latestClockinOut,
                clockInOutInfo30All,
                clockInOutInfo30,
                caseDescriptions,
                appInfo
            }

            /*const result = await sql.query(
            `SELECT c.id AS 'ID', c.SFID AS 'Salesforce ID', c.caregiverID AS 'Caregiver ID', CONCAT(c.firstName, ' ', c.lastName) AS 'Name', c.firstname AS 'First Name', c.lastname AS 'Last Name', c.gender AS 'Gender', 
            c.primarylanguage AS 'Primary Language', c.dob AS 'Date of Birth', c.email AS 'Email', c.phone AS 'Phone', c.mobilephone AS 'Mobile Phone', c.address AS 'Address', c.lat AS 'Latitude', c.lon AS 'Longitude', 
            c.instapayrapidcard AS 'Instant Pay Rapid Card', m.mfscheduleid, m.scheduledstarttime, m.scheduledendtime, m.visitstarttime, m.visitendtime, m.clockintype, m.clockouttype, s.Medflyt_Caregiver_ID__c AS 'Medflyt Caregiver ID', mc.PatientID, mc.GPSLatitude, mc.GPSLongitude, mc.CaregiverID, mc.visitid, mc.visitdate, 
                from freedommobile.mobile.tblcaregivercodes_encrypted c 
                JOIN freedommobile.mobile.tblclockin mc ON c.caregiverID = mc.caregiverid
                    JOIN medflyt.vw.visitinstance m ON c.caregiverID = m.CaregiverID 
                    JOIN Salesforce.salesforce.contacts2 s ON c.SFID = s.id
                        where c.caregivercode=${req.params["caregiverCode"]} AND m.visitDate <=cast(getdate() as date) AND m.visitdate >=cast(Getdate()-${req.params["day"]} as date)
                        order by m.visitDate ${req.params["order"]} `);
            
            console.dir(result.recordsets);
            res.json(result.recordset);
            */
            
            //console.dir(caregiverInfo.recordsets);
            //console.dir(visitInfo.recordsets);
            //console.dir(clockinInfo.recordsets);

            res.status(200).json(result);
            //console.dir(result.caregiverInfo.recordsets);
            //console.dir(result.visitInfo.recordsets);
            //console.dir(result.clockinInfo.recordsets);
            console.dir(result);

            console.log("end");
        } catch (err) {
            // 
            console.log(err);
        } finally {
            //
        }
    })();
});


app.listen(port, ()=> console.log("Server Started"));