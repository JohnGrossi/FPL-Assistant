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
import android.widget.Button;
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
 * Use the {@link HomeTeamFragment#newInstance} factory method to
 * create an instance of this fragment.
 */
public class HomeTeamFragment extends Fragment {

    // TODO: Rename parameter arguments, choose names that match
    // the fragment initialization parameters, e.g. ARG_ITEM_NUMBER
    private static final String ARG_PARAM1 = "param1";
    private static final String ARG_PARAM2 = "param2";
    final String TAG = "TasksSample";
    String homeTeam = "";


    // TODO: Rename and change types of parameters
    private String mParam1;
    private String mParam2;

    public HomeTeamFragment() {
        // Required empty public constructor
    }

    /**
     * Use this factory method to create a new instance of
     * this fragment using the provided parameters.
     *
     * @param param1 Parameter 1.
     * @param param2 Parameter 2.
     * @return A new instance of fragment team1Fragment.
     */
    // TODO: Rename and change types and number of parameters
    public static HomeTeamFragment newInstance(String param1, String param2) {
        HomeTeamFragment fragment = new HomeTeamFragment();
        Bundle args = new Bundle();
        args.putString(ARG_PARAM1, param1);
        args.putString(ARG_PARAM2, param2);
        fragment.setArguments(args);
        return fragment;
    }

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        if (getArguments() != null) {
            mParam1 = getArguments().getString(ARG_PARAM1);
            mParam2 = getArguments().getString(ARG_PARAM2);
        }
    }

    @Override
    public View onCreateView(LayoutInflater inflater, ViewGroup container, Bundle savedInstanceState) {
        View view = inflater.inflate(R.layout.fragment_home_team, container, false);

        String teams = ((PredictedLineupActivity) getActivity()).passInTeams();

        String[] split = teams.split(" v ");
        homeTeam = split[0];
        getPlayers(view);

        Button button = (Button) view.findViewById(R.id.backButton);
        button.setOnClickListener(new View.OnClickListener()
        {
            @Override
            public void onClick(View v)
            {
                getActivity().finish();
            }
        });

        return view;
    }

    public void getPlayers(View view) {

        homeTeam = matchDatabaseName(homeTeam.toUpperCase());

        String[] playerPosition = {"GK1", "DEF1", "DEF2", "DEF3", "DEF4", "MID1", "MID2", "MID3", "MID4", "FWD1", "FWD2"};
        String[] playerPicture = {"GK1picture", "DEF1picture", "DEF2picture", "DEF3picture", "DEF4picture", "MID1picture", "MID2picture", "MID3picture", "MID4picture", "FWD1picture", "FWD2picture"};

        FirebaseFirestore db = FirebaseFirestore.getInstance();
        FirebaseStorage storage = FirebaseStorage.getInstance();
        DocumentReference docRef = db.collection("predictedTeams").document(homeTeam.toUpperCase());
        System.out.println("TEAM: " +homeTeam);

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
                            textView.setText(" "+ document.getString(Integer.toString(i) ) +" ");

                            String filename = document.getString(Integer.toString(i)) +homeTeam + ".png";
                            StorageReference storageReference = storage.getReferenceFromUrl("gs://fpl-assistant-41263.appspot.com/Pics").child(filename);

                            try {
                                final File picture = File.createTempFile(filename, "png");
                                final String whichPic = playerPicture[j];
                                storageReference.getFile(picture).addOnSuccessListener(new OnSuccessListener<FileDownloadTask.TaskSnapshot>() {
                                    @Override
                                    public void onSuccess(FileDownloadTask.TaskSnapshot taskSnapshot) {
                                        int picID = getResources().getIdentifier(whichPic, "id", "com.example.fpl_assistant_app");
                                        Bitmap bitmap = BitmapFactory.decodeFile(picture.getAbsolutePath());
                                        ImageView imageView;
                                        imageView = (ImageView) view.findViewById(picID);
                                        imageView.setImageBitmap(bitmap);
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