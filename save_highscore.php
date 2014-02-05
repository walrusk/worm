<?php

if(is_array($_POST)) {
	
	$name = $_POST['name'];
	
	if(!empty($name)) {		
		include('../walrusk.db.php');
		
		$link = mysql_connect($hostname,$username,$password);
		mysql_select_db($database) or die("Unable to select database");
	
		// data
		$name = mysql_real_escape_string($name);
		$score = mysql_real_escape_string($_POST['score']);
		$ip = $_SERVER['REMOTE_ADDR'];
	
		$result = mysql_query("INSERT INTO highscores (name, ip, score)
		VALUES ('".$name."', '".$ip."',".$score.")",$link);
		
		echo json_encode($result);
		
		mysql_close($link);
	}
	
}