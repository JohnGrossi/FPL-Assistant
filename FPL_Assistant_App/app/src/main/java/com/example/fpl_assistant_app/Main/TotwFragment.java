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

/**
 * A simple {@link Fragment} subclass.
 * Use the {@link TotwFragment#newInstance} factory method to
 * create an instance of this fragment.
 */
public class TotwFragment extends Fragment {

    // TODO: Rename parameter arguments, choose names that match
    // the fragment initialization parameters, e.g. ARG_ITEM_NUMBER
    private static final String ARG_PARAM1 = "param1";
    private static final String ARG_PARAM2 = "param2";

    // TODO: Rename and change types of parameters
    private String mParam1;
    private String mParam2;

    public TotwFragment() {
        // Required empty public constructor
    }

    /**
     * Use this factory method to create a new instance of
     * this fragment using the provided parameters.
     *
     * @param param1 Parameter 1.
     * @param param2 Parameter 2.
     * @return A new instance of fragment TotwFragment.
     */
    // TODO: Rename and change types and number of parameters
    public static TotwFragment newInstance(String param1, String param2) {
        TotwFragment fragment = new TotwFragment();
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
        // Inflate the layout for this fragment
        View view =  inflater.inflate(R.layout.fragment_totw, container, false);

        getPlayers(view);

        return view;
    }

    public void getPlayers(View view) {

        FirebaseFirestore db = FirebaseFirestore.getInstance();
        FirebaseStorage storage = FirebaseStorage.getInstance();
        CollectionReference docRef = db.collection("best11");

        docRef.get().addOnCompleteListener(new OnCompleteListener<QuerySnapshot>() {
            @Override
            public void onComplete(@NonNull Task<QuerySnapshot> task) {
                if (task.isSuccessful()) {
                    int GKnumber = 0;
                    int DEFnumber = 0;
                    int MIDnumber = 0;
                    int FWDnumber = 0;
                    for (QueryDocumentSnapshot document : task.getResult()) {
                        TextView textView;
                        int holder = 0;
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

                        String textViewName = document.getString("position")+holder;
                        Log.d("ACDC", "onComplete: "+textViewName);
                        int resID = getResources().getIdentifier(textViewName, "id", "com.example.fpl_assistant_app");
                        textView = (TextView) view.findViewById(resID);

                        textView.setText(document.getId());

                        String filename = document.getId() +document.getString("team") + ".png";
                        StorageReference storageReference = storage.getReferenceFromUrl("gs://fpl-assistant-41263.appspot.com/Pics").child(filename);

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
                            });
                        } catch (IOException e) {
                            e.printStackTrace();
                        }
                    }
                } else {
                    Log.d("TAG", "Error getting documents: ", task.getException());
                }
            }
        });

    }

}