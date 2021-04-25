package com.example.fpl_assistant_app.Main;

import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.os.Bundle;

import androidx.annotation.NonNull;
import androidx.fragment.app.Fragment;

import android.util.Log;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ImageView;
import android.widget.TextView;

import com.example.fpl_assistant_app.R;
import com.google.android.gms.tasks.OnCompleteListener;
import com.google.android.gms.tasks.OnFailureListener;
import com.google.android.gms.tasks.OnSuccessListener;
import com.google.android.gms.tasks.Task;
import com.google.firebase.firestore.CollectionReference;
import com.google.firebase.firestore.DocumentReference;
import com.google.firebase.firestore.DocumentSnapshot;
import com.google.firebase.firestore.FirebaseFirestore;
import com.google.firebase.firestore.QueryDocumentSnapshot;
import com.google.firebase.firestore.QuerySnapshot;
import com.google.firebase.storage.FileDownloadTask;
import com.google.firebase.storage.FirebaseStorage;
import com.google.firebase.storage.StorageReference;

import java.io.File;
import java.io.IOException;
import java.util.List;


public class TotwFragment extends Fragment {

    public TotwFragment() {
        // Required empty public constructor
    }

    public static TotwFragment newInstance(String param1, String param2) {
        TotwFragment fragment = new TotwFragment();
        Bundle args = new Bundle();
        fragment.setArguments(args);
        return fragment;
    }

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        if (getArguments() != null) {
        }
    }

    @Override
    public View onCreateView(LayoutInflater inflater, ViewGroup container, Bundle savedInstanceState) {
        // Inflate the layout for this fragment
        View view =  inflater.inflate(R.layout.fragment_totw, container, false);
        getPlayers(view);

        return view;
    }

    //gets players
    public void getPlayers(View view) {

        //set up database connection
        FirebaseFirestore db = FirebaseFirestore.getInstance();
        FirebaseStorage storage = FirebaseStorage.getInstance();
        CollectionReference docRef = db.collection("best11");
        docRef.get().addOnCompleteListener(new OnCompleteListener<QuerySnapshot>() {
            //if successful finding best 11
            @Override
            public void onComplete(@NonNull Task<QuerySnapshot> task) {
                if (task.isSuccessful()) {
                    //set number of players for each position to 0 initially
                    int GKnumber = 0;
                    int DEFnumber = 0;
                    int MIDnumber = 0;
                    int FWDnumber = 0;
                    int price = 0;
                    Long captainScore = Long.valueOf(0);
                    String captain = null;

                    //for each player:
                    for (QueryDocumentSnapshot document : task.getResult()) {
                        TextView textView;
                        int holder = 0;
                        //add 1 to the position, holder is the number of players in that position
                        switch(document.getString("position")) {
                            case "GK":
                                GKnumber++;
                                holder = GKnumber;
                                break;
                            case "DEF":
                                DEFnumber++;
                                holder = DEFnumber;
                                break;
                            case "MID":
                                MIDnumber++;
                                holder = MIDnumber;
                                break;
                            case "FWD":
                                FWDnumber++;
                                holder = FWDnumber;
                                break;
                        }
                        Log.d("ACDC", document.getId());

                        // get the players position and the number, this equals the textView name  e.g DEF1 or FWD3
                        String textViewName = document.getString("position")+holder;
                        Log.d("ACDC", "onComplete: "+textViewName);

                        //set to textView
                        int resID = getResources().getIdentifier(textViewName, "id", "com.example.fpl_assistant_app");
                        textView = (TextView) view.findViewById(resID);
                        textView.setText(document.getId());

                        //add up all player prices
                        price += document.getLong("price");

                        //get highest scoring player to be caprain as they should get the most points
                        if(document.getLong("algorithmScore") > captainScore) {
                            captainScore = document.getLong("algorithmScore");
                            captain = document.getId();
                        }

                        //get player's pic
                        String filename = document.getId() +document.getString("team") + ".png";
                        StorageReference storageReference = storage.getReferenceFromUrl("gs://fpl-assistant-41263.appspot.com/Pics").child(filename);

                        //set pic to correct view
                        try {
                            final File picture = File.createTempFile(filename, "png");
                            final String whichPic = textViewName+"picture";
                            storageReference.getFile(picture).addOnSuccessListener(new OnSuccessListener<FileDownloadTask.TaskSnapshot>() {
                                @Override
                                public void onSuccess(FileDownloadTask.TaskSnapshot taskSnapshot) {
                                    int picID = getResources().getIdentifier(whichPic, "id", "com.example.fpl_assistant_app");
                                    Bitmap bitmap = BitmapFactory.decodeFile(picture.getAbsolutePath());
                                    ImageView imageView;
                                    imageView = (ImageView) view.findViewById(picID);
                                    imageView.setImageBitmap(bitmap);
                                }
                            }).addOnFailureListener(new OnFailureListener() {

                                //if not successful, add default image
                                @Override
                                public void onFailure(@NonNull Exception e) {
                                    final File picture2;
                                    try {
                                        picture2 = File.createTempFile("noName", "png");

                                        storageReference.getFile(picture2).addOnSuccessListener(new OnSuccessListener<FileDownloadTask.TaskSnapshot>() {
                                            @Override
                                            public void onSuccess(FileDownloadTask.TaskSnapshot taskSnapshot) {
                                                int picID = getResources().getIdentifier(whichPic, "id", "com.example.fpl_assistant_app");
                                                Bitmap bitmap = BitmapFactory.decodeFile(picture2.getAbsolutePath());
                                                ImageView imageView;
                                                imageView = (ImageView) view.findViewById(picID);
                                                imageView.setImageBitmap(bitmap);
                                            }
                                        });
                                    } catch (IOException ioException) {
                                        ioException.printStackTrace();
                                    }

                                }
                            });
                        } catch (IOException e) {
                            e.printStackTrace();
                        }
                    }

                    //add price to view in correct format. database saves £11 mil as 110. so has to be changed to have £ and .
                    TextView textView;
                    String prices = String.valueOf(price).substring(0, String.valueOf(price).length()-1) +"."+ String.valueOf(price).substring(String.valueOf(price).length()-1);
                    int resID = getResources().getIdentifier("priceNumber", "id", "com.example.fpl_assistant_app");
                    textView = (TextView) view.findViewById(resID);
                    textView.setText("£"+prices);

                    resID = getResources().getIdentifier("captain", "id", "com.example.fpl_assistant_app");
                    textView = (TextView) view.findViewById(resID);
                    textView.setText("Captain: " +captain);
                } else {
                    Log.d("TAG", "Error getting documents: ", task.getException());
                }
            }


        });

    }
}