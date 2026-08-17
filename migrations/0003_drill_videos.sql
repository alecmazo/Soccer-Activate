-- X video locker links (bookmarked instruction clips assigned to drills)
alter table player_profiles
  add column if not exists video_links text not null default '[]';
