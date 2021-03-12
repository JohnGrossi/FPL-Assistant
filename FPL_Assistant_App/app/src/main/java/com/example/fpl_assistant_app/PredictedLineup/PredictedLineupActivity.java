package com.example.fpl_assistant_app.PredictedLineup;

import androidx.appcompat.app.AppCompatActivity;
import androidx.navigation.NavController;
import androidx.navigation.Navigation;
import androidx.navigation.ui.AppBarConfiguration;
import androidx.navigation.ui.NavigationUI;

import android.content.Intent;
import android.os.Bundle;
import android.util.Log;
import android.view.View;
import android.widget.TableLayout;

import com.example.fpl_assistant_app.R;
import com.google.android.material.bottomnavigation.BottomNavigationView;
import com.google.android.material.tabs.TabLayout;

import java.util.HashSet;
import java.util.Set;

public class PredictedLineupActivity extends AppCompatActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        //getSupportActionBar().hide();


        setContentView(R.layout.activity_predicted_lineup);

        BottomNavigationView lineupNavigationView = findViewById(R.id.lineupNavigationView);
        NavController navController = Navigation.findNavController(this,  R.id.fragment2);

        Set<Integer> topLevelDestinations = new HashSet<>();
        topLevelDestinations.add(R.id.homeTeamFragment);
        topLevelDestinations.add(R.id.awayTeamFragment);
        AppBarConfiguration appBarConfiguration = new AppBarConfiguration.Builder(topLevelDestinations).build();
        NavigationUI.setupActionBarWithNavController(this, navController, appBarConfiguration);

        NavigationUI.setupWithNavController(lineupNavigationView, navController);

    }

    public String passInTeams(){
        Intent intent = getIntent();
        String teams = intent.getStringExtra("teams");
        Log.d("HERE", teams);
        String[] split = teams.split(" v ");
        String home = split[0];
        String away = split[1];
        return teams;
    }
}