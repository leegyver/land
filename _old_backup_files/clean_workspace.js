import fs from 'fs';
import path from 'path';

// Clean homepage
const homepageDir = 'e:\\server\\homepage';
const homepageBackupDir = path.join(homepageDir, '_old_backup_files');

if (!fs.existsSync(homepageBackupDir)) {
  fs.mkdirSync(homepageBackupDir, { recursive: true });
}

const homepageItemsToMove = [
  // Folders
  '_recovered', 'backup_1830_code', 'dist_backup', 'dist_debug',
  // Files
  'build_output.log', 'db_audit.txt', 'db_audit2.txt', 'db_env.txt', 
  'final_fix.txt', 'final_recovery.txt', 'final_status.txt', 'full_db_status.txt', 
  'full_scan.txt', 'git_cleanup.txt', 'last_resort.txt', 'long_lines.txt', 
  'pm2_deep.txt', 'pm2_extract.txt', 'pm2_recovery.txt', 'prop_log.txt', 
  'property_changes.txt', 'recovery_result.txt', 'recovery_summary.txt', 
  'safety_fix_result.txt', 'sql_recovery.txt', 'stash_analysis.txt', 
  'system_audit.txt', 'tmp_db_analysis.txt', 'user_insert_data.txt', 
  'user_recovery_result.txt', 'user_search.txt', 'test.js', 'check-db.cjs', 
  'check-property.cjs', 'check_db.js', 'final-fix.cjs'
];

for (const item of homepageItemsToMove) {
  const srcPath = path.join(homepageDir, item);
  const destPath = path.join(homepageBackupDir, item);
  if (fs.existsSync(srcPath)) {
    try {
      fs.renameSync(srcPath, destPath);
      console.log(`Moved ${item} to _old_backup_files`);
    } catch (err) {
      console.error(`Error moving ${item}:`, err.message);
    }
  }
}

// Clean match table
const matchTableDir = 'e:\\server\\match table';
const matchTableBackupDir = path.join(matchTableDir, '_old_backup_files');

if (!fs.existsSync(matchTableBackupDir)) {
  fs.mkdirSync(matchTableBackupDir, { recursive: true });
}

const matchTableItemsToMove = [
  // Folders
  'backups',
  // Files
  'server.js.bak_20260427_141119', 'server_bak_test.js', 'server_ddfeb9f.js', 
  'server_e9eb8df.js', 'server_fixed.js', 'server_head.js', 'server_original.js', 
  'server_reconstructed.js', 'server_remainder.js', 'server_tail.js', 'server_tail.txt', 
  'server_truncated.js', 'temp_email.txt', 'test-db.js', 'test_bracket.js', 
  'test_query.js', 'check_braces.js', 'check_db_mock.js', 'check_matches.js', 
  'check_tables.js', 'clean_server.js', 'db_test.js', 'init_db.js', 
  'apply_award_ui_v170.js', 'deep_clean_order_v159.js', 'final_cleanup_v167.js', 
  'fix_bye.js', 'fix_double_line.js', 'fix_group.js', 'fix_level_recognition_v162.js', 
  'fix_lines.js', 'fix_notch.js', 'fix_observer.js', 'fix_paypal.js', 
  'fix_print_css.js', 'fix_protrusion.js', 'fix_seeding_v161.js', 'fix_syntax.js', 
  'fix_tabs.js', 'force_ui_fix.js', 'old_hanul_v32.js', 'old_hanul_v68.js', 
  'old_hanul_v68_full.js', 'promote_v2_original.js'
];

for (const item of matchTableItemsToMove) {
  const srcPath = path.join(matchTableDir, item);
  const destPath = path.join(matchTableBackupDir, item);
  if (fs.existsSync(srcPath)) {
    try {
      fs.renameSync(srcPath, destPath);
      console.log(`Moved ${item} to _old_backup_files inside match table`);
    } catch (err) {
      console.error(`Error moving ${item} in match table:`, err.message);
    }
  }
}
