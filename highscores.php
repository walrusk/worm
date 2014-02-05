<?php

	include('../walrusk.db.php');

	$link = mysql_connect($hostname,$username,$password);
	mysql_select_db($database) or die("Unable to select database");

	$page = $_GET['page'];
	if(!is_numeric($page)) $page = 0;

	$perpage = 5;
	$offset = $page * $perpage;
	$sql = "SELECT name,score,created FROM highscores ORDER BY score DESC LIMIT ".$perpage." OFFSET ".$offset;
	$result = mysql_query($sql,$link) or die("Unable to select: ".mysql_error());
	
?>

	<ol>
	<?php
	$num = 0;
	while($row = mysql_fetch_row($result)) {
	?>
		<li class="<?= ($num == 0 && $page == 0 ? 'leader' : '' ) ?>" title="<?php echo date('d/m/Y',strtotime($row[2])); ?>">
			<span class="name"><?php echo $row[0]; ?></span>
			<span class="score"><?php echo $row[1]; ?></span>
		</li>
	<?php    
		$num++;
	}
	?>
	</ol>

<?php
	mysql_close($link);