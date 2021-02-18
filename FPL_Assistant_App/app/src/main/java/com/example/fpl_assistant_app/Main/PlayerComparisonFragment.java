package com.example.fpl_assistant_app.Main;

import android.app.Activity;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.os.Bundle;
import android.util.Log;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.AdapterView;
import android.widget.ArrayAdapter;
import android.widget.ImageView;
import android.widget.Spinner;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.fragment.app.Fragment;
import androidx.fragment.app.FragmentActivity;

import com.example.fpl_assistant_app.R;
import com.google.android.gms.tasks.OnCompleteListener;
import com.google.android.gms.tasks.OnSuccessListener;
import com.google.android.gms.tasks.Task;
import com.google.firebase.firestore.CollectionReference;
import com.google.firebase.firestore.DocumentReference;
import com.google.firebase.firestore.DocumentSnapshot;
import com.google.firebase.firestore.FirebaseFirestore;
import com.google.firebase.firestore.QuerySnapshot;
import com.google.firebase.storage.FileDownloadTask;
import com.google.firebase.storage.FirebaseStorage;
import com.google.firebase.storage.StorageReference;

import org.w3c.dom.Text;

import java.io.File;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

/**
 * A simple {@link Fragment} subclass.
 * Use the {@link PlayerComparisonFragment#newInstance} factory method to
 * create an instance of this fragment.
 */
public class PlayerComparisonFragment extends Fragment implements AdapterView.OnItemSelectedListener {

    String[] playerArray;
    Spinner spinner11;
    ArrayAdapter<CharSequence> adapter2 = null;
    Activity thisActivity;
    String team;
    String[] playerStat = {"team", "price", "position", "fitness", "lastFixture", "secondLastFixture", "thirdLastFixture", "lastPoints", "secondLastPoints", "thirdLastPoints", "nextFixture", "secondNextFixture", "thirdNextFixture", "pointsTotal", "cleanSheetTotal", "penaltySaves", "goalsTotal", "assistTotal"};

    public PlayerComparisonFragment() {
        // Required empty public constructor
    }

    /**
     * Use this factory method to create a new instance of
     * this fragment using the provided parameters.
     *
     * @return A new instance of fragment PlayerComparisonFragment.
     */
    // TODO: Rename and change types and number of parameters
    public static PlayerComparisonFragment newInstance(String param1, String param2) {
        PlayerComparisonFragment fragment = new PlayerComparisonFragment();
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
        // Inflate the layout for this fragment
        View view = inflater.inflate(R.layout.fragment_player_comparison, container, false);
        FragmentActivity context = getActivity();
        thisActivity = this.getActivity();
        String teams[] = getResources().getStringArray(R.array.teams);

        Spinner spinner = (Spinner) view.findViewById(R.id.spinner1);
        ArrayAdapter<CharSequence> adapter = new ArrayAdapter<CharSequence>(this.getActivity(), android.R.layout.simple_spinner_item, teams);
        adapter.setDropDownViewResource(android.R.layout.simple_dropdown_item_1line);
        spinner.setAdapter(adapter);
        spinner11 = (Spinner) view.findViewById(R.id.spinner11);
        spinner.setOnItemSelectedListener(this);
        spinner11.setOnItemSelectedListener(this);

        return view;
    }

    @Override
    public void onItemSelected(AdapterView<?> parent, View view, int position, long id) {
        setStats(parent, position);
    }

    @Override
    public void onNothingSelected(AdapterView<?> parent) {

    }

    public void setStats(AdapterView<?> parent, int position) {
        FirebaseFirestore db = FirebaseFirestore.getInstance();
        if (parent.getId() == R.id.spinner1) {
            team = (String) parent.getItemAtPosition(position);
            CollectionReference collectionRef = db.collection("teams").document(((String) parent.getItemAtPosition(position)).toUpperCase()).collection("players");
            collectionRef.get().addOnSuccessListener(new OnSuccessListener<QuerySnapshot>() {
                @Override
                public void onSuccess(QuerySnapshot queryDocumentSnapshots) {
                    List<DocumentSnapshot> snapshotList = queryDocumentSnapshots.getDocuments();
                    ArrayList<String> players = new ArrayList<>();
                    for (DocumentSnapshot snapshot : snapshotList) {
                        //Log.d("big man tag", "onSuccess: " + snapshot.getId());
                        players.add(snapshot.getId());
                    }

                    playerArray = new String[players.size()];
                    playerArray = players.toArray(playerArray);
                    adapter2 = new ArrayAdapter<CharSequence>(thisActivity, android.R.layout.simple_spinner_item, playerArray);

                    adapter2.setDropDownViewResource(android.R.layout.simple_dropdown_item_1line);
                    spinner11.setAdapter(adapter2);
                }
            });
        }
        if (parent.getId() == R.id.spinner11) {
            String player = (String) parent.getItemAtPosition(position);
            setPhoto(player, team.toUpperCase());
            DocumentReference docRef = db.collection("teams").document(team.toUpperCase()).collection("players").document(player);
            docRef.get().addOnCompleteListener(new OnCompleteListener<DocumentSnapshot>() {
                @Override
                public void onComplete(@NonNull Task<DocumentSnapshot> task) {
                    DocumentSnapshot document = task.getResult();
                    for (String i : playerStat) {
                        TextView textView;

                        int resID = getResources().getIdentifier(i, "id", "com.example.fpl_assistant_app");
                        textView = getView().findViewById(resID);

                        if(textView.getResources().getResourceName(textView.getId()).contains("pointsTotal")) {
                            textView.setText("Points:" +String.valueOf(document.get(i)));
                        }else if(textView.getResources().getResourceName(textView.getId()).contains("cleanSheetTotal")) {
                            textView.setText("Clean Sheets:" +String.valueOf(document.get(i)));
                        }else if(textView.getResources().getResourceName(textView.getId()).contains("penaltySaves")) {
                            textView.setText("Penalty Saves:" +String.valueOf(document.get(i)));
                        }else if(textView.getResources().getResourceName(textView.getId()).contains("goalsTotal")) {
                            textView.setText("Goals:" +String.valueOf(document.get(i)));
                        }else if(textView.getResources().getResourceName(textView.getId()).contains("assistTotal")) {
                            textView.setText("Assists:" +String.valueOf(document.get(i)));
                        } else {
                            textView.setText(String.valueOf(document.get(i)));

                        }

                        if (textView.getText().toString().contains("null")) {
                            textView.setText("");
                        }
                    }
                }
            });
        }
    }

    public void setPhoto(String player, String team) {
        FirebaseStorage storage = FirebaseStorage.getInstance();

        String filename = player +team + ".png";
        StorageReference storageReference = storage.getReferenceFromUrl("gs://fpl-assistant-41263.appspot.com/Pics").child(filename);

        try {
            final File picture = File.createTempFile(filename, "png");
            storageReference.getFile(picture).addOnSuccessListener(new OnSuccessListener<FileDownloadTask.TaskSnapshot>() {
                @Override
                public void onSuccess(FileDownloadTask.TaskSnapshot taskSnapshot) {
                    int picID = getResources().getIdentifier("Player1Image", "id", "com.example.fpl_assistant_app");
                    Bitmap bitmap = BitmapFactory.decodeFile(picture.getAbsolutePath());
                    ImageView imageView;
                    imageView = getView().findViewById(picID);
                    imageView.setImageBitmap(bitmap);
                }
            });
        } catch (IOException e) {
            e.printStackTrace();
        }
    }
}