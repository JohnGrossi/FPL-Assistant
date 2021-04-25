package com.example.fpl_assistant_app.Main;

import android.app.Activity;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.Color;
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
import com.google.android.gms.tasks.OnFailureListener;
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

public class PlayerComparisonFragment extends Fragment implements AdapterView.OnItemSelectedListener {

    //set up class variables - spinners and adapters - textView
    Activity thisActivity;
    String[] playerArray;
    String playerImage;
    String team;
    String team1;
    String team2;

    Spinner spinner1;
    Spinner spinner11;
    Spinner spinner2;
    Spinner spinner21;
    ArrayAdapter<CharSequence> adapter2 = null;
    ArrayAdapter<CharSequence> adapter4 = null;

    //list of textview names
    String[] playerStat = {"name", "team", "price", "position", "fitness", "lastFixture", "secondLastFixture", "thirdLastFixture", "lastPoints", "secondLastPoints", "thirdLastPoints", "nextFixture", "secondNextFixture", "thirdNextFixture", "pointsTotal", "cleanSheetTotal", "penaltySaves", "goalsTotal", "assistTotal"};
    String[] playerStat2 = {"name2", "team2", "price2", "position2", "fitness2", "lastFixture2", "secondLastFixture2", "thirdLastFixture2", "lastPoints2", "secondLastPoints2", "thirdLastPoints2", "nextFixture2", "secondNextFixture2", "thirdNextFixture2", "pointsTotal2", "cleanSheetTotal2", "penaltySaves2", "goalsTotal2", "assistTotal2"};


    public PlayerComparisonFragment() {
        // Required empty public constructor
    }

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

        //find the 4 spinner views
        spinner1 = view.findViewById(R.id.spinner1);
        spinner2 = view.findViewById(R.id.spinner2);
        spinner11 = view.findViewById(R.id.spinner11);
        spinner21 = view.findViewById(R.id.spinner21);

        //set adapters and on item section listeners
        ArrayAdapter<CharSequence> adapter = new ArrayAdapter<CharSequence>(this.getActivity(), android.R.layout.simple_spinner_item, teams); //
        ArrayAdapter<CharSequence> adapter3 = new ArrayAdapter<CharSequence>(this.getActivity(), android.R.layout.simple_spinner_item, teams); //
        adapter.setDropDownViewResource(android.R.layout.simple_dropdown_item_1line);
        adapter3.setDropDownViewResource(android.R.layout.simple_dropdown_item_1line);
        spinner1.setAdapter(adapter);
        spinner2.setAdapter(adapter3); //
        spinner1.setOnItemSelectedListener(this);
        spinner11.setOnItemSelectedListener(this);
        spinner2.setOnItemSelectedListener(this);
        spinner21.setOnItemSelectedListener(this);

        return view;
    }

    //when spinner value is selected
    @Override
    public void onItemSelected(AdapterView<?> parent, View view, int position, long id) {
        setStats(parent, position);
    }

    @Override
    public void onNothingSelected(AdapterView<?> parent) {

    }

    //sets depending on which spinner is clicked and the value of it
    public void setStats(AdapterView<?> parent, int position) {
        FirebaseFirestore db = FirebaseFirestore.getInstance();

        //if either team spinner is clicked
        if (parent.getId() == R.id.spinner1 || parent.getId() == R.id.spinner2) {

            if(parent.getId() == R.id.spinner1) {
                team1 = (String) parent.getItemAtPosition(position);
            } else {
                team2 = (String) parent.getItemAtPosition(position);
            }

            //get team clicked and gets players associated with it from database
            team = (String) parent.getItemAtPosition(position);
            CollectionReference collectionRef = db.collection("teams").document(((String) parent.getItemAtPosition(position)).toUpperCase()).collection("players");
            collectionRef.get().addOnSuccessListener(new OnSuccessListener<QuerySnapshot>() {

                //when it gets the players set them to the players array and add them to the next spinner
                @Override
                public void onSuccess(QuerySnapshot queryDocumentSnapshots) {
                    List<DocumentSnapshot> snapshotList = queryDocumentSnapshots.getDocuments();
                    ArrayList<String> players = new ArrayList<>();
                    for (DocumentSnapshot snapshot : snapshotList) {
                        players.add(snapshot.getId());
                    }

                    playerArray = new String[players.size()];
                    playerArray = players.toArray(playerArray);

                    //set next spinner to be filled with players
                    if(parent.getId() == R.id.spinner1) {
                        adapter2 = new ArrayAdapter<CharSequence>(thisActivity, android.R.layout.simple_spinner_item, playerArray);
                        adapter2.setDropDownViewResource(android.R.layout.simple_dropdown_item_1line);
                        spinner11.setAdapter(adapter2);
                    } else {
                        adapter4 = new ArrayAdapter<CharSequence>(thisActivity, android.R.layout.simple_spinner_item, playerArray);
                        adapter4.setDropDownViewResource(android.R.layout.simple_dropdown_item_1line);
                        spinner21.setAdapter(adapter4);
                    }
                }
            });
        }

        //if either player spinner is clicked
        if (parent.getId() == R.id.spinner11 || parent.getId() == R.id.spinner21) {

            if(parent.getId() == R.id.spinner11) {
                team = team1;
            } else {
                team =  team2;
            }

            //get player clicked and set the photo
            String player = (String) parent.getItemAtPosition(position);
            setPhoto(player, team.toUpperCase());

            //search database for players stats
            DocumentReference docRef = db.collection("teams").document(team.toUpperCase()).collection("players").document(player);
            docRef.get().addOnCompleteListener(new OnCompleteListener<DocumentSnapshot>() {

                //once it gets the player data set all the text views
                @Override
                public void onComplete(@NonNull Task<DocumentSnapshot> task) {
                    DocumentSnapshot document = task.getResult();
                    String[] chosen;

                    //get corresponding textViews and imageViews
                    if(parent.getId() == R.id.spinner11) {
                        playerImage = "Player1Image";
                        chosen = playerStat;
                    } else {
                        playerImage = "Player2Image";
                        chosen = playerStat2;
                    }

                    //set player data to textViews
                    for (String i : chosen) {
                        String dbRef = i.replace("2", ""); //this to get the right field from the data, i still hold the text view
                        TextView textView;

                        //find textView
                        int resID = getResources().getIdentifier(i, "id", "com.example.fpl_assistant_app");
                        textView = getView().findViewById(resID);

                        //set values
                        if(textView.getResources().getResourceName(textView.getId()).contains("fitness")) {
                            textView.setText("Fitness: " +String.valueOf(document.get(dbRef)));
                        }else if(textView.getResources().getResourceName(textView.getId()).contains("name")) {
                            textView.setText(player);
                        }else if(textView.getResources().getResourceName(textView.getId()).contains("astFixture")) {
                            setColour(String.valueOf(document.get(dbRef)), textView);
                        }else if(textView.getResources().getResourceName(textView.getId()).contains("price")) {
                            formatPrice(String.valueOf(document.get(dbRef)), textView);
                        } else {
                            textView.setText(" "+ String.valueOf(document.get(dbRef) +" "));
                        }
                        if (textView.getText().toString().contains("null")) {
                            textView.setText("");
                        }
                    }
                }
            });
        }
    }

    //change price '110' or '45' to £11.0 or £4.5 (example)
    public void formatPrice(String price, TextView textView){
    price = "£" +price;
    price = price.substring(0, price.length()-1) +"."+ price.substring(price.length()-1, price.length());
    textView.setText(price);
    }

    //changes results to have have a colour behind it depending on the result, also removes the indictor (W,L,D) when displaying it
    public void setColour(String fixture, TextView textView){
        if (fixture.contains("W")) {
            textView.setBackgroundColor(Color.parseColor("#00FF38"));
        } else if (fixture.contains("L")) {
            textView.setBackgroundColor(Color.parseColor("#FF0000"));
        } else {
            textView.setBackgroundColor(Color.parseColor("#FF6000"));
        }
        fixture = fixture.substring(0, fixture.length() - 2);
        textView.setText(fixture);
    }

    //set photo
    public void setPhoto(String player, String team) { //https://stackoverflow.com/questions/37751202/how-to-check-if-file-exists-in-firebase-storage
        FirebaseStorage storage = FirebaseStorage.getInstance();

        String filename = player +team + ".png";
        StorageReference storageReference = storage.getReferenceFromUrl("gs://fpl-assistant-41263.appspot.com/Pics").child(filename);
        Log.d("TAG", "setPhoto: "+storageReference);

        try {
            final File picture = File.createTempFile(filename, "png");
            storageReference.getFile(picture).addOnSuccessListener(new OnSuccessListener<FileDownloadTask.TaskSnapshot>() {
                @Override
                public void onSuccess(FileDownloadTask.TaskSnapshot taskSnapshot) {
                    int picID = getResources().getIdentifier(playerImage, "id", "com.example.fpl_assistant_app");
                    Bitmap bitmap = BitmapFactory.decodeFile(picture.getAbsolutePath());
                    ImageView imageView;
                    imageView = getView().findViewById(picID);
                    imageView.setImageBitmap(bitmap);
                }
            }).addOnFailureListener(new OnFailureListener() {
                @Override
                public void onFailure(@NonNull Exception exception) {
                    StorageReference storageReference = storage.getReferenceFromUrl("gs://fpl-assistant-41263.appspot.com/Pics").child("noName.png");
                    File picture = null;
                    try {
                        picture = File.createTempFile("noName.png", "png");
                    } catch (IOException e) {
                        e.printStackTrace();
                    }
                    File finalPicture = picture;
                    storageReference.getFile(finalPicture).addOnSuccessListener(new OnSuccessListener<FileDownloadTask.TaskSnapshot>() {
                        @Override
                        public void onSuccess(FileDownloadTask.TaskSnapshot taskSnapshot) {
                            int picID = getResources().getIdentifier(playerImage, "id", "com.example.fpl_assistant_app");
                            Bitmap bitmap = BitmapFactory.decodeFile(finalPicture.getAbsolutePath());
                            ImageView imageView;
                            imageView = getView().findViewById(picID);
                            imageView.setImageBitmap(bitmap);
                        }
                    });
                }
            });
        } catch (IOException e) {
            e.printStackTrace();
        }
    }
}