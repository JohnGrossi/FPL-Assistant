package com.example.fpl_assistant_app.PredictedLineup;

import android.content.Intent;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.os.Bundle;

import androidx.annotation.NonNull;
import androidx.fragment.app.Fragment;

import android.util.Log;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.EditText;
import android.widget.ImageView;
import android.widget.TextView;

import com.example.fpl_assistant_app.Main.Fixture;
import com.example.fpl_assistant_app.Main.MainActivity;
import com.example.fpl_assistant_app.Main.MyFixturesRecyclerViewAdapter;
import com.example.fpl_assistant_app.R;
import com.google.android.gms.tasks.OnCompleteListener;
import com.google.android.gms.tasks.OnSuccessListener;
import com.google.android.gms.tasks.Task;
import com.google.firebase.firestore.DocumentReference;
import com.google.firebase.firestore.DocumentSnapshot;
import com.google.firebase.firestore.FirebaseFirestore;
import com.google.firebase.storage.FileDownloadTask;
import com.google.firebase.storage.FirebaseStorage;
import com.google.firebase.storage.StorageReference;

import java.io.File;
import java.io.IOException;
import java.util.ArrayList;

/**
 * A simple {@link Fragment} subclass.
 * Use the {@link AwayTeamFragment#newInstance} factory method to
 * create an instance of this fragment.
 */
public class AwayTeamFragment extends Fragment {

    final String TAG = "TasksSample";
    String awayTeam = "";

    public AwayTeamFragment() {
        // Required empty public constructor
    }

    public static AwayTeamFragment newInstance(String param1, String param2) {
        AwayTeamFragment fragment = new AwayTeamFragment();
        Bundle args = new Bundle();
        fragment.setArguments(args);
        return fragment;
    }

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
    }

    @Override
    public View onCreateView(LayoutInflater inflater, ViewGroup container, Bundle savedInstanceState) {
        View view = inflater.inflate(R.layout.fragment_away_team, container, false);

        String teams = ((PredictedLineupActivity) getActivity()).passInTeams();

        String[] split = teams.split(" v ");
        awayTeam = split[1];
        getPlayers(view);

        return view;
    }

    public void getPlayers(View view) {

        awayTeam = matchDatabaseName(awayTeam.toUpperCase());

        String[] playerPosition = {"GK1", "DEF1", "DEF2", "DEF3", "DEF4", "MID1", "MID2", "MID3", "MID4", "FWD1", "FWD2"};
        String[] playerPicture = {"GK1picture", "DEF1picture", "DEF2picture", "DEF3picture", "DEF4picture", "MID1picture", "MID2picture", "MID3picture", "MID4picture", "FWD1picture", "FWD2picture"};

        FirebaseFirestore db = FirebaseFirestore.getInstance();
        FirebaseStorage storage = FirebaseStorage.getInstance();
        DocumentReference docRef = db.collection("predictedTeams").document(awayTeam.toUpperCase());
        System.out.println("TEAM: " + awayTeam);

        docRef.get().addOnCompleteListener(new OnCompleteListener<DocumentSnapshot>() {
            @Override
            public void onComplete(@NonNull Task<DocumentSnapshot> task) {
                if (task.isSuccessful()) {
                    DocumentSnapshot document = task.getResult();
                    if (document.exists()) {
                        for (int i = 1, j = 0; i <= 11; i++, j++) {
                            TextView textView;
                            int resID = getResources().getIdentifier(playerPosition[j], "id", "com.example.fpl_assistant_app");
                            textView = (TextView) view.findViewById(resID);

                            Log.d(TAG, "PLAYER: " + document.getString(Integer.toString(i)));
                            textView.setText(document.getString(Integer.toString(i)));

                            String filename = document.getString(Integer.toString(i)) + awayTeam + ".png";
                            StorageReference storageReference = storage.getReferenceFromUrl("gs://fpl-assistant-41263.appspot.com/Pics").child(filename);

                            try {
                                final File picture = File.createTempFile(filename, "png");
                                final String whichPic = playerPicture[j];
                                Log.d(TAG, "CHECKPOINT1 : " + filename);
                                storageReference.getFile(picture).addOnSuccessListener(new OnSuccessListener<FileDownloadTask.TaskSnapshot>() {
                                    @Override
                                    public void onSuccess(FileDownloadTask.TaskSnapshot taskSnapshot) {
                                        Log.d(TAG, "CHECKPOINT2 : ");
                                        int picID = getResources().getIdentifier(whichPic, "id", "com.example.fpl_assistant_app");
                                        Bitmap bitmap = BitmapFactory.decodeFile(picture.getAbsolutePath());
                                        ImageView imageView;
                                        imageView = (ImageView) view.findViewById(picID);
                                        imageView.setImageBitmap(bitmap);
                                        Log.d(TAG, "CHECKPOINT3 : ");
                                    }
                                });
                            } catch (IOException e) {
                                e.printStackTrace();
                            }

                        }

                    } else {
                        Log.d(TAG, "No such document");
                    }
                } else {
                    Log.d(TAG, "get failed with ", task.getException());
                }
            }
        });
    }

    public String matchDatabaseName(String team) {
        switch (team) {
            case "BRIGHTON":
                return "BRIGHTON AND HOVE ALBION";
            case "LEEDS":
                return "LEEDS UNITED";
            case "LEICESTER":
                return "LEICESTER CITY";
            case "MAN CITY":
                return "MANCHESTER CITY";
            case "MAN UTD":
                return "MANCHESTER UNITED";
            case "NEWCASTLE":
                return "NEWCASTLE UNITED";
            case "SHEFFIELD UTD":
                return "SHEFFIELD UNITED";
            case "SPURS":
                return "TOTTENHAM HOTSPUR";
            case "WEST BROM":
                return "WEST BROMWICH ALBION";
            case "WEST HAM":
                return "WEST HAM UNITED";
            case "WOLVES":
                return "WOLVERHAMPTON WANDERERS";
            default:
                return team;
        }
    }
}