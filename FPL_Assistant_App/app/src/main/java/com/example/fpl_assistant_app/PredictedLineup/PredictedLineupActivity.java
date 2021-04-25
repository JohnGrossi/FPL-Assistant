package com.example.fpl_assistant_app.PredictedLineup;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.appcompat.app.AppCompatActivity;
import androidx.fragment.app.Fragment;
import androidx.fragment.app.FragmentManager;
import androidx.fragment.app.FragmentPagerAdapter;
import androidx.fragment.app.FragmentStatePagerAdapter;
import androidx.navigation.NavController;
import androidx.navigation.Navigation;
import androidx.navigation.ui.AppBarConfiguration;
import androidx.navigation.ui.NavigationUI;
import androidx.viewpager.widget.PagerAdapter;
import androidx.viewpager.widget.ViewPager;

import android.content.Intent;
import android.os.Bundle;
import android.util.Log;
import android.view.View;
import android.widget.TableLayout;

import com.example.fpl_assistant_app.Main.MainActivity;
import com.example.fpl_assistant_app.R;
import com.google.android.material.bottomnavigation.BottomNavigationView;
import com.google.android.material.tabs.TabLayout;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

public class PredictedLineupActivity extends AppCompatActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_predicted_lineup);

        //assign variables
        ViewPager viewPager = findViewById(R.id.view_pager);
        PagerAdapter pa = new PagerAdapter(getSupportFragmentManager());
        viewPager.setAdapter(pa);

        //set up home and away tab
        TabLayout tL = findViewById(R.id.tab_layout);
        tL.setupWithViewPager(viewPager);

        getSupportActionBar().setTitle("Team Predictions");

    }

    //get teams from the fixture clicked
    public String passInTeams(){
        Intent intent = getIntent();
        String teams = intent.getStringExtra("teams");
        Log.d("HERE", teams);
        String[] split = teams.split(" v ");
        String home = split[0];
        String away = split[1];
        return teams;
    }

    public void setActionBarTitle(String title) {
        getSupportActionBar().setTitle(title);
    }

    //handle tab clicked
    private class PagerAdapter extends FragmentStatePagerAdapter {

        final int pageCount = 2;
        private String tabTitles[] = new String[] {"Home", "Away"};

        public PagerAdapter(@NonNull FragmentManager fm) {
            super(fm, BEHAVIOR_RESUME_ONLY_CURRENT_FRAGMENT);
        }

        @NonNull
        @Override
        public Fragment getItem(int position) {
            switch (position){
                case 0:
                    return new HomeTeamFragment();
                case 1:
                    return new AwayTeamFragment();
                default:
                    return null;
            }
        }

        @Override
        public int getCount() {
            //return list size
            return pageCount;
        }

        @Nullable
        @Override
        public CharSequence getPageTitle(int position) {
            //return array list position
            return tabTitles[position];
        }
    }
}