<?php
	$con = new COM ("ADODB.Connection") or die("Cannot start ADO");						
	$connStr  ="DRIVER=SQL Server;Server=FCNYSQL01;Database=Freedom;uid=wamp;password=wamp;";	
	$con->open($connStr);
	$query = "SELECT top 1 SFID,firstname,lastname
		from freedommobile.mobile.tblcaregivercodes_encrypted
		where caregivercode=1065";					 
	$rec = $con->execute($query);
	$con=null;
	echo $rec[0] . "<br>";
	echo $rec[1]. "<br>";
	echo $rec[2]. "<br>";
?>